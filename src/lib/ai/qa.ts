import { getAnthropicClient } from "./client";

export interface QAMessage {
  role: "user" | "assistant";
  content: string;
}

export async function* streamQAAnswer(
  code: string,
  explanation: string,
  messages: QAMessage[],
  privacyMode: boolean
): AsyncGenerator<string> {
  const client = getAnthropicClient(privacyMode);

  // Keep last 6 message pairs (12 messages) to manage context window
  const recentMessages = messages.slice(-12);

  const systemPrompt = `You are a helpful assistant that answers questions about a specific code snippet.

The code being discussed:
\`\`\`
${code.slice(0, 3000)}
\`\`\`

The explanation already provided:
${explanation.slice(0, 2000)}

Answer questions clearly and concisely. Stay focused on this specific code.`;

  const stream = client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    system: systemPrompt,
    messages: recentMessages.map((m) => ({ role: m.role, content: m.content })),
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
