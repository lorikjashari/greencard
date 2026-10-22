import "server-only";

import os from "node:os";
import path from "node:path";

/**
 * Fallback location for the file-backed demo store. Vercel normally uses
 * Runtime Cache (see store/index.ts); if that is unavailable, functions can
 * only write under /tmp, which is per-instance and ephemeral. Production use
 * must switch to Firebase (APP_MODE=firebase).
 */
export function demoDataRoot(): string {
  const configured = process.env.DEMO_DATA_DIR?.trim();
  if (configured) return path.resolve(configured);
  if (process.env.VERCEL) return path.join(os.tmpdir(), "greencardkosova-demo");
  return path.join(process.cwd(), ".data");
}
