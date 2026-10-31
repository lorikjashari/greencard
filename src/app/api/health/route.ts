import { getAppMode, auditProductionReadiness } from "@/lib/config";
import { getStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/postgres(ql)?:\/\/\S+/gi, "postgresql://***");
}

async function checkDatabase() {
  if (getAppMode() !== "postgres") {
    return { ok: true, active: false };
  }

  const startedAt = Date.now();
  try {
    const applications = await getStore().count("applications");
    return { ok: true, active: true, applications, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { ok: false, active: true, error: safeMessage(error), latencyMs: Date.now() - startedAt };
  }
}

export async function GET() {
  const checks = auditProductionReadiness();
  const database = await checkDatabase();
  const critical = checks.filter((check) => ["session_secret", "app_mode", "database"].includes(check.key));
  const ready = critical.every((check) => check.ok) && database.ok;

  return Response.json(
    {
      ok: true,
      status: ready ? "ready" : "degraded",
      mode: getAppMode(),
      checks,
      database,
      checkedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
