import "server-only";

import os from "node:os";
import path from "node:path";

/**
 * Location for the file-backed demo store. On Vercel, functions can only write
 * under /tmp, which is per-instance and ephemeral. Production use must set
 * DATABASE_URL and run with APP_MODE=postgres.
 */
export function demoDataRoot(): string {
  const configured = process.env.DEMO_DATA_DIR?.trim();
  if (configured) return path.resolve(configured);
  if (process.env.VERCEL) return path.join(os.tmpdir(), "greencardkosova-demo");
  return path.join(process.cwd(), ".data");
}
