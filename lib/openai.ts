import { buildChatMessages, type ChatContextInput } from "@/lib/chat-context";

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

export async function generateOpenAIResponse(context: ChatContextInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: buildChatMessages(context),
      max_tokens: 500,
      temperature: 0.7,
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}): ${text}`);
  }

  const data = JSON.parse(text) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}
