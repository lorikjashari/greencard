import type { NextRequest } from "next/server";
import { getBlobStore } from "@/lib/store";
import { authorizeDraft } from "@/lib/repo/drafts";
import { getApplication, computeCompleteness, updateApplication, addActivity } from "@/lib/repo/applications";
import { getActiveDvYear } from "@/lib/repo/dv-years";
import { getSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/status/transitions";
import { filePreviewUrl } from "@/lib/auth/signed-url";
import { getClientIp, isSameOrigin, json, fail, tooMany } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { validatePhoto, stripJpegMetadata, photoStorageKey, photoUploadLocked } from "@/lib/dv/photo-rules";
import { nowIso } from "@/lib/ids";
import type { PhotoRecord } from "@/lib/types";

export const runtime = "nodejs";

function memberName(
  data: {
    applicant: { firstName: string; lastName: string };
    spouse: { firstName: string; lastName: string };
    children: Array<{ id: string; firstName: string; lastName: string }>;
  },
  memberKey: string,
): string {
  if (memberKey === "applicant") return `${data.applicant.firstName} ${data.applicant.lastName}`.trim();
  if (memberKey === "spouse") return `${data.spouse.firstName} ${data.spouse.lastName}`.trim();
  const id = memberKey.replace("child:", "");
  const child = data.children.find((candidate) => candidate.id === id);
  return child ? `${child.firstName} ${child.lastName}`.trim() : memberKey;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return fail("Origjina nuk lejohet.", 403);

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > 6 * 1024 * 1024) return fail("Skedari është shumë i madh.", 413);

  const form = await request.formData().catch(() => null);
  if (!form) return fail("Kërkesa nuk është e vlefshme.", 400);

  const file = form.get("file");
  const memberKey = String(form.get("memberKey") ?? "");
  const draftId = String(form.get("draftId") ?? "");
  const applicationId = String(form.get("applicationId") ?? "");

  if (!(file instanceof File)) return fail("Mungon skedari.", 400);
  if (file.size > 5 * 1024 * 1024) return fail("Skedari është shumë i madh (max 5 MB).", 413);
  if (!memberKey) return fail("Mungon personi për foton.", 400);

  const ip = getClientIp(request);
  const limit = rateLimit(`upload:${ip}:${draftId || applicationId}`, 40, 60 * 60 * 1000);
  if (!limit.ok) return tooMany(limit.retryAfterSeconds);

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > 5 * 1024 * 1024) return fail("Skedari është shumë i madh (max 5 MB).", 413);

  const validation = validatePhoto(bytes, file.type);
  if (!validation.contentType) {
    return fail("Pranohen vetëm fotografi JPEG ose PNG.", 415);
  }

  const payload = validation.contentType === "image/jpeg" ? stripJpegMetadata(bytes) : bytes;
  const key = photoStorageKey(draftId || applicationId, memberKey, validation.contentType);
  const rulesVersion = (await getActiveDvYear()).photoRulesVersion;
  const status: PhotoRecord["status"] = validation.ok ? "valid" : "invalid";

  const now = nowIso();

  if (draftId) {
    const secret = request.headers.get("x-draft-secret") ?? "";
    const draft = await authorizeDraft(draftId, secret);
    if (!draft) return fail("Drafti nuk u gjet ose ka skaduar.", 404);

    const allowed = new Set([
      "applicant",
      "spouse",
      ...draft.data.children.map((child) => `child:${child.id}`),
    ]);
    if (!allowed.has(memberKey)) return fail("Personi nuk i përket këtij drafti.", 422);

    // Authorisation succeeds before any bytes are written.
    await getBlobStore().put(key, payload, validation.contentType);

    const photo: PhotoRecord = {
      id: crypto.randomUUID(),
      memberKey,
      memberName: memberName(draft.data, memberKey),
      storageKey: key,
      originalName: file.name.slice(0, 200),
      contentType: validation.contentType,
      bytes: payload.length,
      width: validation.width,
      height: validation.height,
      status,
      issues: validation.issues,
      rulesVersion,
      uploadedAt: now,
      previewUrl: filePreviewUrl(key),
    };

    return json({ ok: true, photo });
  }

  if (applicationId) {
    const session = await getSession();
    if (!session) return fail("Duhet të identifikohesh.", 401);

    const application = await getApplication(applicationId);
    if (!application) return fail("Aplikimi nuk u gjet.", 404);

    const isOwner = session.role === "client" && application.ownerEmail === session.email;
    const isStaff = session.role !== "client" && hasPermission(session.role, "photos.review");
    if (!isOwner && !isStaff) return fail("Nuk ke akses në këtë aplikim.", 403);

    const photoLocked = photoUploadLocked(application.status);
    if (photoLocked) {
      return fail(
        "Fotoja nuk mund të ndryshohet pasi rasti ka kaluar në verifikim final ose është dorëzuar. Kontakto stafin.",
        409,
      );
    }

    const required = new Set([
      "applicant",
      ...(application.household.spouseIncluded && application.spouse ? ["spouse"] : []),
      ...application.children.map((child) => `child:${child.id}`),
    ]);
    if (!required.has(memberKey)) return fail("Personi nuk i përket këtij aplikimi.", 422);

    await getBlobStore().put(key, payload, validation.contentType);

    const photo: PhotoRecord = {
      id: crypto.randomUUID(),
      memberKey,
      memberName: memberName(
        {
          applicant: application.applicant,
          spouse: application.spouse ?? { firstName: "", lastName: "" },
          children: application.children,
        },
        memberKey,
      ),
      storageKey: key,
      originalName: file.name.slice(0, 200),
      contentType: validation.contentType,
      bytes: payload.length,
      width: validation.width,
      height: validation.height,
      status,
      issues: validation.issues,
      rulesVersion,
      uploadedAt: now,
      previewUrl: filePreviewUrl(key),
    };

    const photos = [...application.photos.filter((entry) => entry.memberKey !== memberKey), photo];
    const completeness = computeCompleteness({
      applicant: application.applicant,
      spouse: application.spouse,
      children: application.children,
      contact: application.contact,
      household: application.household,
      photos,
    });

    await updateApplication(application.id, {
      photos,
      completeness,
    });

    await addActivity({
      applicationId: application.id,
      type: "photo_uploaded",
      actorId: session.uid,
      actorName: isOwner ? "Klienti" : session.email,
      visibility: "internal",
      message: `Foto e re u ngarkua për ${photo.memberName || memberKey}.`,
    });

    return json({ ok: true, photo });
  }

  return fail("Mungon konteksti i aplikimit.", 400);
}
