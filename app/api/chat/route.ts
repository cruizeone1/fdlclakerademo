import { NextResponse } from "next/server";
import { MAX_DOCUMENT_CHARS } from "@/lib/documents.shared";
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
    const documentContent = body.documentContent?.trim();
    const documentName = body.documentName?.trim();

    if (!prompt) {
      return NextResponse.json<ChatErrorResponse>(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    if (documentContent && documentContent.length > MAX_DOCUMENT_CHARS) {
      return NextResponse.json<ChatErrorResponse>(
        { error: `Document exceeds ${MAX_DOCUMENT_CHARS} characters.` },
        { status: 400 },
      );
    }

    const context = {
      prompt,
      documentContent: documentContent || undefined,
      documentName: documentName || undefined,
    };

    const guardResult = await screenPromptWithLakera(context);

    if (guardResult.flagged) {
      const blocked: ChatResponse = {
        status: "blocked",
        prompt,
        documentName: documentName || undefined,
        hasDocument: Boolean(documentContent),
        guard: {
          flagged: true,
          requestUuid: guardResult.requestUuid,
          breakdown: guardResult.breakdown,
          triggeredDetectors: guardResult.triggeredDetectors,
          message: documentContent
            ? "Potential prompt injection detected in the prompt or uploaded document. The request was blocked and was not sent to OpenAI."
            : "Potential prompt injection detected. The request was blocked and was not sent to OpenAI.",
        },
      };
      return NextResponse.json(blocked);
    }

    const aiResponse = await generateOpenAIResponse(context);

    const success: ChatResponse = {
      status: "allowed",
      prompt,
      documentName: documentName || undefined,
      hasDocument: Boolean(documentContent),
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
