// import { hash, compare } from "bcryptjs";

import { encodeBase64 } from "hono/utils/encode";

// export async function hashPassword(password: string) {
//   return await hash(password, 10);
// }

// export async function verifyPassword(password: string, hash: string) {
//   return await compare(password, hash);
// }

const encoder = new TextEncoder();

// Helper: Uint8Array ↔ Base64 (sin Buffer, 100% compatible con Workers)
function bytesToBase64(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binString);
}

function base64ToBytes(base64: string): Uint8Array {
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.charCodeAt(0));
}

// 1. Hashear: generamos salt + derivamos clave con PBKDF2
export async function hashPassword(password: string): Promise<string> {
  // Salt aleatorio de 16 bytes
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Importamos la password como clave raw
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);

  // Derivamos 256 bits usando PBKDF2
  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const hash = new Uint8Array(derived);

  // Guardamos como: salt.hash (ambos en base64)
  return `${bytesToBase64(salt)}.${bytesToBase64(hash)}`;
}

// 2. Verificar: extraemos el salt del hash guardado, re-derivamos y comparamos
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [saltB64, hashB64] = storedHash.split(".");
  if (!saltB64 || !hashB64) return false;

  const salt = base64ToBytes(saltB64);
  const originalHash = base64ToBytes(hashB64);

  // Re-derivamos con el MISMO salt
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);

  const derived = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  const attemptHash = new Uint8Array(derived);

  // Comparación constant-time para evitar timing attacks
  if (attemptHash.length !== originalHash.length) return false;
  let result = 0;
  for (let i = 0; i < attemptHash.length; i++) {
    result |= attemptHash[i] ^ originalHash[i];
  }
  return result === 0;
}

// never save tokens directly on DB,
export async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeBase64(hashBuffer);
}
