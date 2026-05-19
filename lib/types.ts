import type { GuardBreakdownItem } from "@/lib/lakera";

export interface ChatRequestBody {
  prompt: string;
}

export interface ChatSuccessResponse {
  status: "allowed";
  prompt: string;
  response: string;
  guard: {
    flagged: false;
    requestUuid?: string;
    breakdown: GuardBreakdownItem[];
  };
}

export interface ChatBlockedResponse {
  status: "blocked";
  prompt: string;
  guard: {
    flagged: true;
    requestUuid?: string;
    breakdown: GuardBreakdownItem[];
    triggeredDetectors: string[];
    message: string;
  };
}

export type ChatResponse = ChatSuccessResponse | ChatBlockedResponse;

export interface ChatErrorResponse {
  error: string;
}
