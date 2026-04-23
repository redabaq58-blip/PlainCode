import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";

const answeredSchema = z.object({
  id: z.number(),
  category: z.string(),
  question: z.string(),
  answer: z.string(),
  score: z.number(),
  feedback: z.string(),
});

const schema = z.object({
  answers: z.array(answeredSchema).length(5),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { answers } = parsed.data;
  const defenseScore = Math.round(answers.reduce((sum, a) => sum + a.score, 0) / 5);
  const client = getAnthropicClient();

  try {
    const sortedByScore = [...answers].sort((a, b) => a.score - b.score);
    const summary = sortedByScore
      .map(
        (a) =>
          `[${a.category}] Score: ${a.score}/100\nQ: ${a.question}\nFeedback: ${a.feedback}`
      )
      .join("\n\n");

    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `Based on these 5 technical defense answers, identify the 3 most important gaps in the developer's understanding of their own codebase.

ANSWERS (worst to best):
${summary}

Each weak spot should name the specific gap and why it matters — one sharp sentence per spot.

Return ONLY valid JSON (no markdown):
{
  "weakSpots": [
    "<specific weakness 1>",
    "<specific weakness 2>",
    "<specific weakness 3>"
  ]
}`,
        },
      ],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("No response");
    const result = JSON.parse(block.text);

    return NextResponse.json({
      defenseScore,
      weakSpots: result.weakSpots as string[],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Summary failed" },
      { status: 500 }
    );
  }
}
