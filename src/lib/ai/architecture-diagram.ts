import { getAnthropicClient } from "@/lib/ai/client";

function stripFences(raw: string): string {
  return raw
    .replace(/^```(?:mermaid)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

interface DiagramContext {
  techStack: string;
  architecture: string;
  dangerHints?: string[];
}

export async function generateArchitectureDiagram(
  repoCode: string,
  ctx: DiagramContext
): Promise<string> {
  const client = getAnthropicClient();
  const dangerBlock =
    ctx.dangerHints && ctx.dangerHints.length > 0
      ? `\nKnown issues to mark as danger zones: ${ctx.dangerHints.join(", ")}`
      : "";

  try {
    const res = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `Based on this repository (tech stack: ${ctx.techStack}, architecture: ${ctx.architecture}):

${repoCode.slice(0, 4000)}${dangerBlock}

Generate a Mermaid flowchart showing the architecture layers. Include:
- Frontend layer (pages, components)
- API routes layer
- Database or data layer
- External APIs if present (Stripe, Anthropic, email, etc.)
- Auth layer if present
- Mark any danger zones using: classDef danger fill:#ef4444,color:#fff,stroke:#dc2626

STRICT RULES — the output must be valid Mermaid or it will crash:
- Start with exactly: graph TD
- Maximum 12 nodes total
- Node IDs: alphanumeric only, no spaces (e.g. Frontend, APIRoutes, DB)
- Node labels: plain text only, no parentheses, brackets, slashes, or quotes inside labels
- Arrow syntax: A --> B or A -->|label| B only
- Place classDef and class lines at the very end
- Output ONLY the Mermaid syntax — no explanation, no markdown fences, no extra text`,
        },
      ],
    });

    const block = res.content[0];
    if (!block || block.type !== "text") return "";
    return stripFences(block.text);
  } catch {
    return "";
  }
}
