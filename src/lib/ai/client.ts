import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

export function getAnthropicClient(privacyMode = false): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  if (privacyMode) {
    // Return a client configured with no-training header for privacy mode
    return new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
      defaultHeaders: { "anthropic-beta": "no-training-2025-08-01" },
    });
  }
  return _client;
}
