import type { GuardBreakdownItem } from "@/lib/lakera";

export interface ChatRequestBody {
  prompt: string;
  documentContent?: string;
  documentName?: string;
}

interface ChatGuardResult {
  flagged: boolean;
  requestUuid?: string;
  breakdown: GuardBreakdownItem[];
}

export interface ChatSuccessResponse {
  status: "allowed";
  prompt: string;
  documentName?: string;
  hasDocument: boolean;
  response: string;
  guard: ChatGuardResult & { flagged: false };
}

export interface ChatBlockedResponse {
  status: "blocked";
  prompt: string;
  documentName?: string;
  hasDocument: boolean;
  guard: ChatGuardResult & {
    flagged: true;
    triggeredDetectors: string[];
    message: string;
  };
}

export type ChatResponse = ChatSuccessResponse | ChatBlockedResponse;

export interface ChatErrorResponse {
  error: string;
}
