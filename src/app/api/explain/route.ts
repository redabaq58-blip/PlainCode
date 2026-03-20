import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { encodePipelineStream } from "@/lib/ai/pipeline";
import { saveExplanation, incrementMonthlyUsage, getMonthlyUsage } from "@/lib/db/queries/explanations";
import { encrypt } from "@/lib/encryption/at-rest";
import type { AudienceLevel, ExplainMode, ExplanationResult } from "@/types/explanation";

const FREE_MONTHLY_LIMIT = 999999; // unlimited — app is free for everyone

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
  const session = await auth();
  const userId = session?.user?.id;

  // Rate limiting for authenticated users (generous, app is free)
  if (userId) {
    const usage = await getMonthlyUsage(userId);
    if (usage >= FREE_MONTHLY_LIMIT) {
      return NextResponse.json({ error: "Monthly limit reached" }, { status: 429 });
    }
  }

  const stream = encodePipelineStream({
    code,
    audienceLevel: audienceLevel as AudienceLevel,
    outputLanguage,
    privacyMode,
  });

  // We need to intercept the stream to save to DB after completion
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const reader = stream.getReader();
  const decoder = new TextDecoder();

  let fullResult: ExplanationResult | null = null;

  (async () => {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      await writer.write(value);

      // Parse SSE events to capture the final result
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "done" && event.result) {
              fullResult = event.result as ExplanationResult;
            }
          } catch {}
        }
      }
    }

    // Save to DB after stream completes
    if (fullResult && userId && !privacyMode) {
      try {
        const encryptedCode = await encrypt(code);
        await saveExplanation({
          userId,
          audienceLevel: audienceLevel as AudienceLevel,
          mode: "STANDARD" as ExplainMode,
          privacyMode,
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
        await incrementMonthlyUsage(userId);
      } catch (err) {
        console.error("Failed to save explanation:", err);
      }
    }

    writer.close();
  })();

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
