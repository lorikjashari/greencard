import { createHash, randomBytes, randomInt, randomUUID } from "node:crypto";

/** Reference alphabet without ambiguous characters (0/O, 1/I/L). */
const REF_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function newId(prefix?: string): string {
  const id = randomUUID();
  return prefix ? `${prefix}_${id}` : id;
}

export function publicRef(): string {
  let body = "";
  for (let i = 0; i < 5; i += 1) {
    body += REF_ALPHABET[randomInt(0, REF_ALPHABET.length)];
  }
  return `GCK-${body}`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addMinutes(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

export function addDays(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export function isExpired(iso: string | null | undefined): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}
