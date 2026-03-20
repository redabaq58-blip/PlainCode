import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { encodePipelineStream } from "@/lib/ai/pipeline";
import { saveExplanation } from "@/lib/db/queries/explanations";
import { encrypt } from "@/lib/encryption/at-rest";
import type { AudienceLevel, ExplainMode, ExplanationResult } from "@/types/explanation";

const schema = z.object({
  code: z.string().min(1).max(50000),
  audienceLevel: z.enum(["ELI5", "NON_TECHNICAL", "BUSINESS_CONTEXT", "TECHNICAL_NON_DEV", "DEVELOPER_PEER"]),
  outputLanguage: z.string().default("English"),
  privacyMode: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { code, audienceLevel, outputLanguage, privacyMode } = parsed.data;

  const pipelineStream = encodePipelineStream({
    code,
    audienceLevel: audienceLevel as AudienceLevel,
    outputLanguage,
    privacyMode,
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const outputStream = new ReadableStream({
    async start(controller) {
      const reader = pipelineStream.getReader();
      let fullResult: ExplanationResult | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                if (event.type === "done" && event.result) {
                  fullResult = event.result as ExplanationResult;
                }
              } catch {}
            }
          }

          controller.enqueue(value);
        }

        // Save to DB after stream completes (skip if privacyMode)
        if (fullResult && !privacyMode) {
          try {
            const encryptedCode = await encrypt(code);
            const saved = await saveExplanation({
              audienceLevel: audienceLevel as AudienceLevel,
              mode: "STANDARD" as ExplainMode,
              outputLanguage,
              codeSnippetEnc: encryptedCode.enc,
              codeSnippetIv: encryptedCode.iv,
              summaryText: fullResult.summaryText,
              breakdownText: fullResult.breakdownText,
              analogyText: fullResult.analogyText,
              dataMapText: fullResult.dataMapText,
              confidenceScore: fullResult.confidenceScore,
              mermaidDiagram: fullResult.mermaidDiagram,
              layer1Confidence: fullResult.layer1Confidence,
              layer3Passed: fullResult.layer3Passed,
            });
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "savedId", savedId: saved.id })}\n\n`)
            );
          } catch (err) {
            console.error("Failed to save explanation:", err);
          }
        }

        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Stream error";
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`)
          );
          controller.close();
        } catch {}
        reader.cancel().catch(() => {});
      }
    },
  });

  return new Response(outputStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
