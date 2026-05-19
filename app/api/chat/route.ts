import { NextResponse } from "next/server";
import { screenPromptWithLakera } from "@/lib/lakera";
import { generateOpenAIResponse } from "@/lib/openai";
import type {
  ChatErrorResponse,
  ChatRequestBody,
  ChatResponse,
} from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const prompt = body.prompt?.trim();

    if (!prompt) {
      return NextResponse.json<ChatErrorResponse>(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    // Step 1: Screen user input with Lakera Guard BEFORE calling OpenAI
    const guardResult = await screenPromptWithLakera(prompt);

    if (guardResult.flagged) {
      const blocked: ChatResponse = {
        status: "blocked",
        prompt,
        guard: {
          flagged: true,
          requestUuid: guardResult.requestUuid,
          breakdown: guardResult.breakdown,
          triggeredDetectors: guardResult.triggeredDetectors,
          message:
            "Potential prompt injection detected. The request was blocked and was not sent to OpenAI.",
        },
      };
      return NextResponse.json(blocked);
    }

    // Step 2: Only call OpenAI when Lakera marks the prompt as safe
    const aiResponse = await generateOpenAIResponse(prompt);

    const success: ChatResponse = {
      status: "allowed",
      prompt,
      response: aiResponse,
      guard: {
        flagged: false,
        requestUuid: guardResult.requestUuid,
        breakdown: guardResult.breakdown,
      },
    };

    return NextResponse.json(success);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json<ChatErrorResponse>({ error: message }, { status: 500 });
  }
}
