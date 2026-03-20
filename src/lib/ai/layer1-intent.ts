import { getAnthropicClient } from "./client";

export interface Layer1Result {
  inferredPurpose: string;
  primaryLanguage: string;
  complexitySignals: string[];
  confidence: number;
}

export async function runLayer1(code: string, privacyMode: boolean): Promise<Layer1Result> {
  const client = getAnthropicClient(privacyMode);

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Analyze this code and return ONLY valid JSON (no markdown, no explanation):

\`\`\`
${code.slice(0, 4000)}
\`\`\`

Return this exact shape:
{
  "inferredPurpose": "<one sentence describing what this code does>",
  "primaryLanguage": "<detected language>",
  "complexitySignals": ["<any unclear or complex aspects>"],
  "confidence": <integer 0-100 reflecting how confident you are in the purpose>
}`,
      },
    ],
  });

  try {
    const text = response.content[0].type === "text" ? response.content[0].text : "{}";
    return JSON.parse(text) as Layer1Result;
  } catch {
    return {
      inferredPurpose: "unknown purpose",
      primaryLanguage: "unknown",
      complexitySignals: [],
      confidence: 50,
    };
  }
}
