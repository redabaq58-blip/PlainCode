import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamQAAnswer } from "@/lib/ai/qa";
import { getExplanationById } from "@/lib/db/queries/explanations";
import { decrypt } from "@/lib/encryption/at-rest";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/config";

const schema = z.object({
  explanationId: z.string(),
  question: z.string().min(1).max(2000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { explanationId, question } = parsed.data;
  const session = await auth();

  const explanation = await getExplanationById(explanationId);
  if (!explanation) {
    return NextResponse.json({ error: "Explanation not found" }, { status: 404 });
  }

  // Decrypt code if available
  let code = "";
  if (explanation.codeSnippetEnc && explanation.codeSnippetIv) {
    code = await decrypt(explanation.codeSnippetEnc, explanation.codeSnippetIv);
  }

  // Load Q&A history
  const existingMessages = await prisma.qAMessage.findMany({
    where: { explanationId },
    orderBy: { createdAt: "asc" },
    take: 12,
  });

  const messages = [
    ...existingMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: question },
  ];

  // Save user message
  await prisma.qAMessage.create({
    data: { explanationId, role: "user", content: question },
  });

  const combinedExplanation = [
    explanation.summaryText,
    explanation.breakdownText,
    explanation.analogyText,
  ].join("\n\n");

  const encoder = new TextEncoder();
  let assistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamQAAnswer(code, combinedExplanation, messages, false)) {
          assistantResponse += delta;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`));
        }

        // Save assistant response
        await prisma.qAMessage.create({
          data: { explanationId, role: "assistant", content: assistantResponse },
        });

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Q&A failed" })}\n\n`)
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
