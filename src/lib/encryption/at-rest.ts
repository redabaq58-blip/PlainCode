function getKeyHex(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ENCRYPTION_KEY environment variable is required in production");
    }
    // In dev/test, use a deterministic 32-byte key (never for real data)
    return "0".repeat(64);
  }
  if (key.length !== 64 || !/^[0-9a-fA-F]+$/.test(key)) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }
  return key;
}

let _cryptoKey: CryptoKey | null = null;

async function getKey(): Promise<CryptoKey> {
  if (_cryptoKey) return _cryptoKey;
  const keyBuffer = Buffer.from(getKeyHex(), "hex");
  _cryptoKey = await crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
  return _cryptoKey;
}

export async function encrypt(plaintext: string): Promise<{ enc: string; iv: string }> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return {
    enc: Buffer.from(encrypted).toString("base64"),
    iv: Buffer.from(iv).toString("base64"),
  };
}

export async function decrypt(enc: string, ivBase64: string): Promise<string> {
  const key = await getKey();
  const iv = Buffer.from(ivBase64, "base64");
  const encBuffer = Buffer.from(enc, "base64");
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encBuffer);
  return new TextDecoder().decode(decrypted);
}
