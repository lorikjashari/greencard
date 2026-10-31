#!/usr/bin/env node
/**
 * Set a staff password in Neon.
 *
 *   ADMIN_PASSWORD='...' npm run db:set-password -- admin@example.com
 *
 * The password is read from ADMIN_PASSWORD so it never lands in shell history.
 * Stored as Argon2id. Also clears any lockout.
 */
import { neon } from "@neondatabase/serverless";
import { Algorithm, hash } from "@node-rs/argon2";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required. Run `neon env pull` first.");
  process.exit(1);
}

const email = (process.argv[2] ?? "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "";

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error("Usage: ADMIN_PASSWORD='...' npm run db:set-password -- <email>");
  process.exit(1);
}
if (password.length < 10) {
  console.error("ADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

const passwordHash = await hash(password, {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
});

const sql = neon(url);
const patch = JSON.stringify({ passwordHash, failedSignIns: 0, lockedUntil: null });

const updated = await sql`
  UPDATE app_documents
  SET data = data || ${patch}::jsonb, updated_at = now()
  WHERE collection = 'users' AND data->>'email' = ${email}
  RETURNING id
`;

if (updated.length === 0) {
  console.error(`No user found for ${email}. Create it first with db:bootstrap.`);
  process.exit(1);
}

console.log(`password updated for ${email} (id ${updated[0].id})`);
