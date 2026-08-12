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

const SYSTEM_PROMPT =
  "You are a helpful assistant for a product demo. Answer clearly and concisely based on any reference document provided.";

export async function screenPromptWithLakera(
  context: ChatContextInput,
): Promise<GuardScreenResult> {
  const apiKey = process.env.LAKERA_API_KEY;
  if (!apiKey) {
    throw new Error("LAKERA_API_KEY is not configured");
  }

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
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
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
