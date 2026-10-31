#!/usr/bin/env node
/**
 * Reset the demo data store and uploads.
 *
 * The demo seed is idempotent and is recreated automatically the next time a
 * demo page is opened (or a demo account signs in). This script never touches
 * Postgres; it refuses to run when APP_MODE=postgres.
 */
import { rmSync } from "node:fs";
import { resolve } from "node:path";

if (process.env.APP_MODE === "postgres") {
  console.error("Refusing to reset: APP_MODE=postgres. This script only resets the local demo store.");
  process.exit(1);
}

const root = resolve(process.cwd(), ".data");

for (const target of ["store", "uploads"]) {
  const path = resolve(root, target);
  rmSync(path, { recursive: true, force: true });
  console.log(`Removed ${path}`);
}

console.log("Demo data reset. Open the app or sign in with a seeded demo account to reseed.");
