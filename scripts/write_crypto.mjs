/** AES-GCM + PBKDF2. Password lives only in GitHub Actions secrets, never in the repo. */
const SALT = new TextEncoder().encode("yu312-write-v1-salt");
const ITERATIONS = 210_000;

function b64ToBytes(b64) {
  return Uint8Array.from(Buffer.from(String(b64).trim(), "base64"));
}

export async function decryptNoteBlob(password, b64) {
  if (!password) throw new Error("WRITE_PASSWORD secret is empty");
  const raw = b64ToBytes(b64);
  if (raw.length < 13) throw new Error("payload too short");
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: SALT, iterations: ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  } catch {
    throw new Error("decrypt failed (wrong password or corrupted payload)");
  }
  return JSON.parse(new TextDecoder().decode(plain));
}
