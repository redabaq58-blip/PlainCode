const KEY_HEX = process.env.ENCRYPTION_KEY ?? "";

async function getKey(): Promise<CryptoKey> {
  const keyBuffer = Buffer.from(KEY_HEX, "hex");
  return crypto.subtle.importKey("raw", keyBuffer, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
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
