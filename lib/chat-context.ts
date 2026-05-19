import { SYSTEM_PROMPT } from "./lakera";

export interface ChatContextInput {
  prompt: string;
  documentContent?: string;
  documentName?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export function buildChatMessages(context: ChatContextInput): ChatMessage[] {
  const messages: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];
  const document = context.documentContent?.trim();

  if (document) {
    const label = context.documentName ? ` (${context.documentName})` : "";
    messages.push({
      role: "user",
      content: `Reference document${label}:\n${document}`,
    });
  }

  messages.push({ role: "user", content: context.prompt });
  return messages;
}
