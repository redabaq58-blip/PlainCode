import { getAnthropicClient } from "./client";

export interface Layer3Result {
  accurate: boolean;
  errors: { section: string; description: string; correction: string }[];
  confidenceAdjustment: number;
}

export async function runLayer3(
  code: string,
  explanation: string,
  privacyMode: boolean
): Promise<Layer3Result> {
  const client = getAnthropicClient(privacyMode);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [
      {
        role: "user",
        content: `You are an adversarial code reviewer. Check whether this explanation of the code is accurate.

CODE:
\`\`\`
${code.slice(0, 4000)}
\`\`\`

EXPLANATION:
${explanation.slice(0, 3000)}

Return ONLY valid JSON (no markdown):
{
  "accurate": <true if explanation is mostly correct, false if there are significant errors>,
  "errors": [{ "section": "<SUMMARY|BREAKDOWN|ANALOGY|DATAMAP>", "description": "<what is wrong>", "correction": "<what it should say>" }],
  "confidenceAdjustment": <integer -30 to +10 reflecting accuracy quality>
}

If the explanation is accurate, return an empty errors array and a positive confidenceAdjustment.`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    return JSON.parse(text) as Layer3Result;
  } catch {
    return { accurate: true, errors: [], confidenceAdjustment: 0 };
  }
}

export async function reviseExplanation(
  code: string,
  originalExplanation: string,
  errors: Layer3Result["errors"],
  privacyMode: boolean
): Promise<string> {
  const client = getAnthropicClient(privacyMode);

  const corrections = errors
    .map((e) => `- ${e.section}: ${e.description}. Fix: ${e.correction}`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `The following explanation has errors. Fix only the erroneous sections while keeping the same section delimiter format.

ORIGINAL EXPLANATION:
${originalExplanation.slice(0, 3000)}

ERRORS TO FIX:
${corrections}

Return the corrected explanation using the same <!-- SECTION:X --> delimiters.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : originalExplanation;
}
