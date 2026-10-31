import { describe, expect, it } from "vitest";
import {
  hashPassword,
  passwordPolicyError,
  verifyPassword,
  verifyPasswordForMissingUser,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
} from "./password";

describe("password hashing", () => {
  it("hashes with argon2id and verifies the same password", async () => {
    const stored = await hashPassword("diamant123@");
    expect(stored.startsWith("$argon2id$")).toBe(true);
    await expect(verifyPassword(stored, "diamant123@")).resolves.toBe(true);
  });

  it("rejects a wrong password", async () => {
    const stored = await hashPassword("correct-horse-battery");
    await expect(verifyPassword(stored, "wrong-password")).resolves.toBe(false);
  });

  it("rejects malformed hashes without throwing", async () => {
    await expect(verifyPassword("not-a-hash", "anything")).resolves.toBe(false);
  });

  it("returns false for missing accounts", async () => {
    await expect(verifyPasswordForMissingUser("anything")).resolves.toBe(false);
  });

  it("enforces the minimum and maximum length", () => {
    expect(passwordPolicyError("a".repeat(MIN_PASSWORD_LENGTH - 1))).toBe("short");
    expect(passwordPolicyError("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
    expect(passwordPolicyError("a".repeat(MAX_PASSWORD_LENGTH + 1))).toBe("long");
  });

  it("refuses to hash a password that fails policy", async () => {
    await expect(hashPassword("short")).rejects.toThrow(/Password rejected/);
  });
});
