import { buildChatMessages, type ChatContextInput } from "@/lib/chat-context";

export interface GuardBreakdownItem {
  project_id?: string;
  policy_id?: string;
  detector_id?: string;
  detector_type?: string;
  detected?: boolean;
  message_id?: number;
}

export interface GuardResponse {
  flagged: boolean;
  breakdown?: GuardBreakdownItem[];
  metadata?: {
    request_uuid?: string;
  };
}

export interface GuardScreenResult {
  flagged: boolean;
  breakdown: GuardBreakdownItem[];
  requestUuid?: string;
  triggeredDetectors: string[];
}

/**
 * Guard SaaS — https://docs.lakera.ai/docs/api/guard
 * Default to Virginia (us-east-1). This org rejects EU processing (401).
 */
const LAKERA_GUARD_URL =
  process.env.LAKERA_GUARD_URL ?? "https://us-east-1.api.lakera.ai/v2/guard";
const DEFAULT_AUTH_URL =
  "https://cloudinfra-gw-us.portal.checkpoint.com/auth/external";

const SYSTEM_PROMPT =
  "You are a helpful assistant for a product demo. Answer clearly and concisely based on any reference document provided.";

let cachedPortalToken: { value: string; expiresAtMs: number } | null = null;
/** Once a dashboard key is known-bad (401), skip it for this process and use portal. */
let guardApiKeyRejected = false;

interface AuthResponse {
  token?: string;
  expiresIn?: number;
  data?: {
    token?: string;
    expiresIn?: number;
  };
}

async function getPortalToken(): Promise<string> {
  const clientId = process.env.LAKERA_CLIENT_ID;
  const accessKey = process.env.LAKERA_ACCESS_KEY;
  if (!clientId || !accessKey) {
    throw new Error("LAKERA_CLIENT_ID and LAKERA_ACCESS_KEY are required for portal auth");
  }

  const now = Date.now();
  if (cachedPortalToken && cachedPortalToken.expiresAtMs > now + 60_000) {
    return cachedPortalToken.value;
  }

  const authUrl = process.env.LAKERA_AUTH_URL ?? DEFAULT_AUTH_URL;
  const response = await fetch(authUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, accessKey }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Check Point auth failed (${response.status}): ${errorText}`);
  }

  const payload = (await response.json()) as AuthResponse;
  const token = payload.data?.token ?? payload.token;
  if (!token) {
    throw new Error("Check Point auth response did not include a token");
  }

  const expiresInSec = payload.data?.expiresIn ?? payload.expiresIn ?? 25 * 60;
  cachedPortalToken = {
    value: token,
    expiresAtMs: now + Math.max(expiresInSec - 60, 60) * 1000,
  };
  return token;
}

function getDashboardGuardKey(): string | null {
  if (guardApiKeyRejected) return null;
  return process.env.LAKERA_GUARD_API_KEY ?? null;
}

/**
 * Prefer dashboard Guard API key (attributes to platform analytics).
 * Fall back to Infinity Portal Client ID/Secret token.
 * Docs: https://docs.lakera.ai/docs/api#authentication
 */
async function resolveBearerToken(preferPortal: boolean): Promise<{ token: string; source: "guard_key" | "portal" }> {
  if (!preferPortal) {
    const apiKey = getDashboardGuardKey();
    if (apiKey) {
      return { token: apiKey, source: "guard_key" };
    }
  }

  if (process.env.LAKERA_CLIENT_ID && process.env.LAKERA_ACCESS_KEY) {
    return { token: await getPortalToken(), source: "portal" };
  }

  const apiKey = getDashboardGuardKey() ?? process.env.LAKERA_API_KEY;
  if (apiKey) {
    return { token: apiKey, source: "guard_key" };
  }

  throw new Error(
    "Lakera auth is not configured — set LAKERA_GUARD_API_KEY and/or LAKERA_CLIENT_ID + LAKERA_ACCESS_KEY",
  );
}

async function postGuard(
  bearerToken: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(LAKERA_GUARD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

export async function screenPromptWithLakera(
  context: ChatContextInput,
): Promise<GuardScreenResult> {
  const body: Record<string, unknown> = {
    messages: buildChatMessages(context),
    breakdown: true,
  };

  const projectId = process.env.LAKERA_PROJECT_ID;
  if (projectId) {
    body.project_id = projectId;
  }

  let { token, source } = await resolveBearerToken(false);
  let response = await postGuard(token, body);

  // Dashboard key invalid → retry once with Infinity Portal token.
  if (response.status === 401 && source === "guard_key") {
    guardApiKeyRejected = true;
    cachedPortalToken = null;
    ({ token, source } = await resolveBearerToken(true));
    response = await postGuard(token, body);
  }

  if (!response.ok) {
    if (response.status === 401) {
      cachedPortalToken = null;
    }
    const errorText = await response.text();
    throw new Error(
      `Lakera Guard request failed (${response.status}) via ${source}: ${errorText}`,
    );
  }

  const data = (await response.json()) as GuardResponse;
  const triggeredDetectors = (data.breakdown ?? [])
    .filter((item) => item.detected)
    .map((item) => item.detector_type ?? item.detector_id ?? "unknown");

  return {
    flagged: data.flagged,
    breakdown: data.breakdown ?? [],
    requestUuid: data.metadata?.request_uuid,
    triggeredDetectors,
  };
}

export { SYSTEM_PROMPT };
