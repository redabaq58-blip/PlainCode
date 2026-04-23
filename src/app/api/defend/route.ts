import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAnthropicClient } from "@/lib/ai/client";

const schema = z.object({
  repoCode: z.string().min(100).max(35_000),
});

export interface DefendQuestion {
  id: number;
  category: string;
  question: string;
}

interface RepoAnalysis {
  techStack: string;
  architecture: string;
  keyRisks: string[];
}

async function analyzeRepo(repoCode: string): Promise<RepoAnalysis> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `Analyze this codebase and return ONLY valid JSON (no markdown):

\`\`\`
${repoCode.slice(0, 5000)}
\`\`\`

Return this exact shape:
{
  "techStack": "<languages, frameworks, databases, key libraries>",
  "architecture": "<brief architectural pattern — e.g. REST API, monorepo, event-driven>",
  "keyRisks": ["<technical risk 1>", "<technical risk 2>", "<technical risk 3>"]
}`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") throw new Error("no response");
    return JSON.parse(block.text) as RepoAnalysis;
  } catch {
    return {
      techStack: "unknown",
      architecture: "unknown",
      keyRisks: [],
    };
  }
}

async function generateQuestions(
  repoCode: string,
  analysis: RepoAnalysis
): Promise<DefendQuestion[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a senior engineer conducting a rigorous technical defense. Based on the codebase below, generate exactly 5 adversarial questions — one per category — that probe the developer's understanding of their own design decisions.

CODEBASE ANALYSIS:
- Tech stack: ${analysis.techStack}
- Architecture: ${analysis.architecture}
- Key risks: ${analysis.keyRisks.join(", ")}

CODEBASE:
\`\`\`
${repoCode.slice(0, 10000)}
\`\`\`

Requirements for each question:
- Reference SPECIFIC details from this codebase (file names, function names, patterns you actually see)
- Be answerable in 2-3 paragraphs by the person who built it
- Have a clear defensible position — not a trick question
- Be genuinely adversarial: assume the developer made a suboptimal choice and make them defend it

Return ONLY valid JSON (no markdown):
{
  "questions": [
    { "id": 1, "category": "Architecture", "question": "<specific architecture question referencing actual code>" },
    { "id": 2, "category": "Edge Cases", "question": "<specific edge case question referencing actual code>" },
    { "id": 3, "category": "Security", "question": "<specific security question referencing actual code>" },
    { "id": 4, "category": "Scalability", "question": "<specific scalability question referencing actual code>" },
    { "id": 5, "category": "Alternatives", "question": "<why this approach vs alternatives, referencing actual code>" }
  ]
}`,
      },
    ],
  });

  const block = res.content[0];
  if (!block || block.type !== "text") throw new Error("No questions generated");
  const parsed = JSON.parse(block.text);
  if (!Array.isArray(parsed.questions) || parsed.questions.length !== 5) {
    throw new Error("Invalid questions format");
  }
  return parsed.questions as DefendQuestion[];
}

async function validateAndRefineQuestions(
  questions: DefendQuestion[],
  repoCode: string
): Promise<DefendQuestion[]> {
  const client = getAnthropicClient();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 700,
    messages: [
      {
        role: "user",
        content: `Review these 5 technical defense questions for quality. Reject any that are generic (could apply to any codebase) or unanswerable without more context.

QUESTIONS:
${JSON.stringify(questions, null, 2)}

CODEBASE EXCERPT:
\`\`\`
${repoCode.slice(0, 3000)}
\`\`\`

Return ONLY valid JSON (no markdown):
{
  "allSpecific": <true if all questions reference specific code details>,
  "improvements": [
    { "id": <question id>, "betterQuestion": "<more specific, adversarial version>" }
  ]
}

Only include improvements for questions that are too generic. If all are fine, return empty improvements array.`,
      },
    ],
  });

  try {
    const block = res.content[0];
    if (!block || block.type !== "text") return questions;
    const result = JSON.parse(block.text);
    if (!result.allSpecific && Array.isArray(result.improvements)) {
      return questions.map((q) => {
        const imp = result.improvements.find(
          (i: { id: number; betterQuestion: string }) => i.id === q.id
        );
        return imp ? { ...q, question: imp.betterQuestion } : q;
      });
    }
  } catch {
    // fall through to return originals
  }
  return questions;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  try {
    const { repoCode } = parsed.data;
    const analysis = await analyzeRepo(repoCode);
    const questions = await generateQuestions(repoCode, analysis);
    const refined = await validateAndRefineQuestions(questions, repoCode);
    return NextResponse.json({ questions: refined });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate questions" },
      { status: 500 }
    );
  }
}
