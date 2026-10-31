#!/usr/bin/env node
/**
 * Create (or promote) a staff account in Neon.
 *
 *   npm run db:bootstrap -- admin@example.com "Full Name" admin
 *
 * Roles: admin | operator | accountant | viewer. Defaults to admin.
 * Safe to re-run: an existing account is promoted/renamed, not duplicated.
 */
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL (or DATABASE_URL_UNPOOLED) is required. Run `neon env pull` first.");
  process.exit(1);
}

const [rawEmail, rawName, rawRole] = process.argv.slice(2);
const email = (rawEmail ?? "").trim().toLowerCase();
const role = (rawRole ?? "admin").trim().toLowerCase();
const allowed = new Set(["admin", "operator", "accountant", "viewer"]);

if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
  console.error("Usage: npm run db:bootstrap -- <email> [name] [admin|operator|accountant|viewer]");
  process.exit(1);
}
if (!allowed.has(role)) {
  console.error(`Invalid role "${role}". Use one of: ${[...allowed].join(", ")}.`);
  process.exit(1);
}

const name = (rawName ?? "").trim() || email.split("@")[0];
const sql = neon(url);
const now = new Date().toISOString();

const existing = await sql`
  SELECT id FROM app_documents
  WHERE collection = 'users' AND data->>'email' = ${email}
  LIMIT 1
`;

let id = existing[0]?.id;
let action = "updated";

if (id) {
  const patch = JSON.stringify({ email, name, role, active: true });
  await sql`
    UPDATE app_documents
    SET data = data || ${patch}::jsonb, updated_at = now()
    WHERE collection = 'users' AND id = ${id}
  `;
} else {
  id = crypto.randomUUID();
  const record = {
    id,
    email,
    name,
    role,
    active: true,
    createdAt: now,
    lastSignInAt: null,
    invitedBy: null,
  };
  await sql`
    INSERT INTO app_documents (collection, id, data)
    VALUES ('users', ${id}, ${JSON.stringify(record)}::jsonb)
  `;
  action = "created";
}

console.log(`${action} ${role} account: ${email} (id ${id})`);
console.log("Sign in at /admin/login with a magic link sent to this address.");
