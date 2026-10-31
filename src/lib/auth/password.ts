import { hash, verify } from "@node-rs/argon2";

export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 256;

const OPTIONS = {
  // Argon2id. Numeric literal because @node-rs/argon2 exposes a const enum.
  algorithm: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

/**
 * A valid Argon2id hash of a throwaway value. Used to keep response timing
 * similar when the account does not exist or has no password set.
 */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$lPhec3kW5UHJrVjYgVplYA$jtkg1Bf2RDBcsvmsByg06hlh0UwX5UiH44iW2XQX5jI";

export function passwordPolicyError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) return "short";
  if (password.length > MAX_PASSWORD_LENGTH) return "long";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const policy = passwordPolicyError(password);
  if (policy) throw new Error(`Password rejected: ${policy}`);
  return hash(password, OPTIONS);
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  if (!storedHash || password.length === 0) return false;
  try {
    return await verify(storedHash, password, OPTIONS);
  } catch {
    return false;
  }
}

/** Verifies against a dummy hash so missing accounts take similar time. */
export async function verifyPasswordForMissingUser(password: string): Promise<false> {
  await verifyPassword(DUMMY_HASH, password);
  return false;
}
