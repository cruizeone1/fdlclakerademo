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

const LAKERA_GUARD_URL = "https://api.lakera.ai/v2/guard";
const DEFAULT_AUTH_URL =
  "https://cloudinfra-gw-us.portal.checkpoint.com/auth/external";

const SYSTEM_PROMPT =
  "You are a helpful assistant for a product demo. Answer clearly and concisely based on any reference document provided.";

/** Cached Infinity Portal token (expires ~30 minutes). */
let cachedToken: { value: string; expiresAtMs: number } | null = null;

interface AuthResponse {
  token?: string;
  expiresIn?: number;
  success?: boolean;
  data?: {
    token?: string;
    expiresIn?: number;
  };
}

function extractToken(payload: AuthResponse): { token: string; expiresInSec: number } {
  const token = payload.data?.token ?? payload.token;
  if (!token) {
    throw new Error("Check Point auth response did not include a token");
  }

  const expiresInSec = payload.data?.expiresIn ?? payload.expiresIn ?? 25 * 60;
  return { token, expiresInSec };
}

/**
 * Exchange Infinity Portal Client ID + Secret for a short-lived Bearer token.
 * Falls back to LAKERA_API_KEY when Client ID credentials are not configured.
 */
async function getLakeraBearerToken(): Promise<string> {
  const legacyApiKey = process.env.LAKERA_API_KEY;
  const clientId = process.env.LAKERA_CLIENT_ID;
  const accessKey = process.env.LAKERA_ACCESS_KEY;

  if (!clientId || !accessKey) {
    if (legacyApiKey) {
      return legacyApiKey;
    }
    throw new Error(
      "Lakera auth is not configured — set LAKERA_CLIENT_ID and LAKERA_ACCESS_KEY (or LAKERA_API_KEY)",
    );
  }

  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 60_000) {
    return cachedToken.value;
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
  const { token, expiresInSec } = extractToken(payload);

  cachedToken = {
    value: token,
    // Refresh a minute early; clamp to at least 60s of usable life.
    expiresAtMs: now + Math.max(expiresInSec - 60, 60) * 1000,
  };

  return token;
}

export async function screenPromptWithLakera(
  context: ChatContextInput,
): Promise<GuardScreenResult> {
  const bearerToken = await getLakeraBearerToken();

  const body: Record<string, unknown> = {
    messages: buildChatMessages(context),
    breakdown: true,
  };

  const projectId = process.env.LAKERA_PROJECT_ID;
  if (projectId) {
    body.project_id = projectId;
  }

  const response = await fetch(LAKERA_GUARD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Auth token may have been revoked early — clear cache and surface the error.
    if (response.status === 401) {
      cachedToken = null;
    }
    const errorText = await response.text();
    throw new Error(`Lakera Guard request failed (${response.status}): ${errorText}`);
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
