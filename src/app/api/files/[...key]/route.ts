import type { NextRequest } from "next/server";
import { getBlobStore } from "@/lib/store";
import { getSession, isStaffRole } from "@/lib/auth/session";
import { verifyFileToken } from "@/lib/auth/signed-url";
import { listApplicationsForEmail } from "@/lib/repo/applications";
import { hasPermission } from "@/lib/status/transitions";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await context.params;
  const key = segments.join("/");

  if (!key.startsWith("photos/") || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  const token = request.nextUrl.searchParams.get("t");
  let authorized = verifyFileToken(key, token);

  if (!authorized) {
    const session = await getSession();
    if (session) {
      if (isStaffRole(session.role)) {
        authorized = hasPermission(session.role, "photos.review");
      } else if (session.role === "client") {
        const applications = await listApplicationsForEmail(session.email);
        authorized = applications.some((application) =>
          application.photos.some((photo) => photo.storageKey === key),
        );
      }
    }
  }

  if (!authorized) {
    return new Response("Not found", { status: 404 });
  }

  const blob = await getBlobStore().get(key);
  if (!blob) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(blob.data), {
    status: 200,
    headers: {
      "content-type": blob.contentType,
      "content-length": String(blob.data.length),
      "cache-control": "private, max-age=0, no-store",
      "x-content-type-options": "nosniff",
      "content-disposition": `inline; filename="${key.split("/").pop() ?? "photo"}"`,
      "content-security-policy": "default-src 'none'; sandbox",
    },
  });
}
