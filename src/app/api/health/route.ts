import { getAppMode, auditProductionReadiness } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks = auditProductionReadiness();
  const critical = checks.filter((check) => ["session_secret", "app_mode", "firebase_admin"].includes(check.key));
  const ready = critical.every((check) => check.ok);

  return Response.json(
    {
      ok: true,
      status: ready ? "ready" : "degraded",
      mode: getAppMode(),
      checks,
      checkedAt: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { "cache-control": "no-store" },
    },
  );
}
