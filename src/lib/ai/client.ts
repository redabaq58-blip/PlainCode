import Anthropic from "@anthropic-ai/sdk";

function createClient(extraHeaders?: Record<string, string>): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  return new Anthropic({
    apiKey,
    ...(extraHeaders ? { defaultHeaders: extraHeaders } : {}),
  });
}

let _defaultClient: Anthropic | null = null;

export function getAnthropicClient(privacyMode = false): Anthropic {
  if (privacyMode) {
    // Privacy mode: fresh client with no-training header, not cached
    return createClient({ "anthropic-beta": "no-training-2025-08-01" });
  }
  if (!_defaultClient) {
    _defaultClient = createClient();
  }
  return _defaultClient;
}
