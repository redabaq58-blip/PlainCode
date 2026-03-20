import type { AudienceLevel } from "@/types/explanation";

const AUDIENCE_SYSTEM_PROMPTS: Record<AudienceLevel, string> = {
  ELI5: `You explain code as if talking to a curious 5-year-old. Use only everyday analogies (toys, food, games). Never use any technical terms, programming concepts, or jargon whatsoever. Keep it fun and simple.`,
  NON_TECHNICAL: `You explain code to someone with no programming background. Use plain English and real-world analogies. You may mention business concepts but never use code syntax or technical programming terms.`,
  BUSINESS_CONTEXT: `You explain code from a product and business perspective. Focus on: what problem it solves, what it means for users, what the business impact is. Light technical vocabulary is OK but code syntax is not.`,
  TECHNICAL_NON_DEV: `You explain code to someone technical (data analyst, sys admin, tech writer) but not a developer. Technical vocabulary and concepts are fine; actual code syntax examples are not needed.`,
  DEVELOPER_PEER: `You explain code peer-to-peer with a fellow developer. Use full technical language: design patterns, complexity, edge cases, code smells, architectural trade-offs, security implications. Be precise and thorough.`,
};

export function buildLayer2SystemPrompt(audienceLevel: AudienceLevel): string {
  return `You are PlainCode, an expert code explanation engine.

${AUDIENCE_SYSTEM_PROMPTS[audienceLevel]}

CRITICAL FORMAT REQUIREMENT: Your response MUST use these exact section delimiters in this exact order. Do not omit any section.

<!-- SECTION:SUMMARY -->
[A concise explanation of what this code does overall]

<!-- SECTION:BREAKDOWN -->
[Step-by-step walkthrough of the key parts]

<!-- SECTION:ANALOGY -->
[A relatable real-world analogy that captures the essence]

<!-- SECTION:DATAMAP -->
[What data/information goes in, what comes out, and what transforms]

<!-- SECTION:MERMAID -->
[A Mermaid.js flowchart (flowchart TD syntax) showing the logic flow. If a diagram is not useful, write: none]

This format is mandatory. Output section delimiters exactly as shown.`;
}

export function buildLayer2UserPrompt(
  code: string,
  inferredPurpose: string,
  outputLanguage: string,
  isDiff = false,
  codeBefore?: string,
  codeAfter?: string
): string {
  const codeBlock = isDiff
    ? `BEFORE:\n\`\`\`\n${codeBefore?.slice(0, 3000)}\n\`\`\`\n\nAFTER:\n\`\`\`\n${codeAfter?.slice(0, 3000)}\n\`\`\``
    : `\`\`\`\n${code.slice(0, 6000)}\n\`\`\``;

  const task = isDiff
    ? "Explain what changed between the BEFORE and AFTER versions of this code. Focus on the meaning of the changes, not just that they differ."
    : `Explain this code. The code's inferred purpose is: "${inferredPurpose}". Use this as grounding.`;

  return `${task}

${codeBlock}

Write your entire response in ${outputLanguage}.

REMINDER: Use the section delimiters exactly as specified in your instructions.`;
}
