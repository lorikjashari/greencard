"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentStaff } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/status/transitions";
import { assertApplicationTransition } from "@/lib/status/transitions";
import {
  addActivity,
  computeCompleteness,
  getApplication,
  updateApplication,
} from "@/lib/repo/applications";
import {
  getOrder,
  getOrderForApplication,
  recordCashPayment,
  refundOrder,
  reviewPaymentMismatch,
} from "@/lib/repo/orders";
import { getFilingForApplication, recordFiling } from "@/lib/repo/filings";
import { createMagicToken } from "@/lib/repo/tokens";
import { queueEmail, retryNotification } from "@/lib/notifications/service";
import { updateSettings } from "@/lib/repo/settings";
import { setActiveDvYear, upsertDvYear } from "@/lib/repo/dv-years";
import {
  countActiveAdmins,
  findUserById,
  upsertTeamMember,
  updateUserRecord,
} from "@/lib/repo/users";
import { resolveEditRequest, updateDataRequest } from "@/lib/repo/requests";
import { logAudit } from "@/lib/repo/audit";
import { filingBlockers } from "@/lib/admin/filing-readiness";
import { emailConfigured, getPublicConfig } from "@/lib/config";
import { copy } from "@/messages/get";
import type { ApplicationRecord, ApplicationStatus, Locale, Role } from "@/lib/types";

function withParam(path: string, key: string, value: string): string {
  const url = new URL(path, "http://internal");
  url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function safePath(formData: FormData, fallback: string): string {
  const raw = String(formData.get("redirectTo") ?? "");
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

async function requirePermission(permission: Parameters<typeof hasPermission>[1], formData: FormData) {
  const staff = await currentStaff();
  if (!staff) redirect("/admin/login");
  if (!hasPermission(staff.role, permission)) {
    redirect(withParam(safePath(formData, "/admin"), "error", "forbidden"));
  }
  return staff;
}

function revalidateApplication(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/applications/${id}`);
  revalidatePath("/admin/review");
  revalidatePath("/admin/photos");
  revalidatePath("/admin/payments");
  revalidatePath("/admin/payments/reconciliation");
  revalidatePath("/admin/filing");
  revalidatePath("/admin/reports");
}

async function portalLinkFor(application: ApplicationRecord): Promise<string> {
  const token = await createMagicToken({
    email: application.contact.email,
    purpose: "portal",
    applicationId: application.id,
    ttlMinutes: 60 * 24 * 7,
  });
  const config = getPublicConfig();
  return `${config.appUrl}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${application.locale}&kind=portal`;
}

export async function changeStatusAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/applications");
  const staff = await requirePermission("applications.transition", formData);
  const applicationId = String(formData.get("applicationId") ?? "");
  const next = String(formData.get("status") ?? "") as ApplicationStatus;
  const reason = String(formData.get("reason") ?? "").trim();

  if (next === "filed" || next === "confirmation_sent") {
    redirect(withParam(back, "error", "use_filing"));
  }

  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));

  const check = assertApplicationTransition(staff.role, application.status, next);
  if (!check.ok) redirect(withParam(back, "error", "transition"));

  if (next === "needs_information" && reason.length < 5) {
    redirect(withParam(back, "error", "reason_required"));
  }
  if (next === "ready_to_file") {
    const order = await getOrderForApplication(application.id);
    const blockers = filingBlockers(application, order);
    if (blockers.includes("payment")) redirect(withParam(back, "error", "payment_required"));
    if (blockers.includes("amount_mismatch")) {
      redirect(withParam(back, "error", "payment_mismatch_unreviewed"));
    }
    if (blockers.length > 0) redirect(withParam(back, "error", "case_incomplete"));
  }

  await updateApplication(application.id, {
    status: next,
    statusReason: reason || application.statusReason,
  });

  const locale: Locale = application.locale;
  const statusLabel = copy(locale).status[next];
  await addActivity({
    applicationId: application.id,
    type: "status_changed",
    actorId: staff.uid,
    actorName: staff.email,
    visibility: "client",
    message:
      locale === "sq"
        ? `Statusi u përditësua: ${statusLabel}.${reason ? ` Shënim: ${reason}` : ""}`
        : `Status updated: ${statusLabel}.${reason ? ` Note: ${reason}` : ""}`,
  });

  if (next === "needs_information") {
    await queueEmail({
      to: application.contact.email,
      type: "info_requested",
      locale,
      applicationId: application.id,
      dedupeKey: `info:${application.id}:${reason}:${new Date().toISOString().slice(0, 10)}`,
      context: {
        name: application.applicant.firstName,
        reference: application.ref,
        message: reason,
        link: await portalLinkFor(application),
      },
    });
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "application.status_changed",
    entityType: "application",
    entityId: application.id,
    summary: `Status ${application.status} → ${next}.`,
    metadata: { from: application.status, to: next },
  });

  revalidateApplication(application.id);
  redirect(withParam(back, "notice", "status"));
}

export async function assignAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/applications");
  const staff = await requirePermission("applications.assign", formData);
  const applicationId = String(formData.get("applicationId") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");

  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));

  let assigneeName = "—";
  if (assigneeId) {
    const assignee = await findUserById(assigneeId);
    if (!assignee || !assignee.active || assignee.role === "client") {
      redirect(withParam(back, "error", "invalid_assignee"));
    }
    assigneeName = assignee.name;
  }

  await updateApplication(application.id, { assigneeId: assigneeId || null });
  await addActivity({
    applicationId: application.id,
    type: "assigned",
    actorId: staff.uid,
    actorName: staff.email,
    visibility: "internal",
    message: assigneeId ? `Rasti iu caktua ${assigneeName}.` : "Caktimi u hoq.",
  });
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "application.assigned",
    entityType: "application",
    entityId: application.id,
    summary: assigneeId ? `Assigned to ${assigneeName}.` : "Assignment cleared.",
  });

  revalidateApplication(application.id);
  redirect(withParam(back, "notice", "assigned"));
}

export async function addNoteAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/applications");
  const staff = await requirePermission("applications.view_sensitive", formData);
  if (staff.role === "viewer" || staff.role === "accountant") {
    redirect(withParam(back, "error", "forbidden"));
  }

  const applicationId = String(formData.get("applicationId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const visibility = formData.get("visibility") === "client" ? "client" : "internal";

  if (message.length < 3 || message.length > 2000) {
    redirect(withParam(back, "error", "note_length"));
  }
  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));

  await addActivity({
    applicationId: application.id,
    type: visibility === "client" ? "client_message" : "note",
    actorId: staff.uid,
    actorName: staff.email,
    visibility,
    message,
  });
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: visibility === "client" ? "application.client_message" : "application.note",
    entityType: "application",
    entityId: application.id,
    summary: message.slice(0, 140),
  });

  revalidateApplication(application.id);
  redirect(withParam(back, "notice", "note"));
}

export async function reviewPhotoAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/photos");
  const staff = await requirePermission("photos.review", formData);
  const applicationId = String(formData.get("applicationId") ?? "");
  const photoId = String(formData.get("photoId") ?? "");
  const decision = formData.get("decision") === "reject" ? "rejected" : "approved";
  const note = String(formData.get("note") ?? "").trim().slice(0, 500);

  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));
  const photo = application.photos.find((entry) => entry.id === photoId);
  if (!photo) redirect(withParam(back, "error", "not_found"));
  if (decision === "rejected" && note.length < 3) {
    redirect(withParam(back, "error", "photo_note"));
  }

  const photos = application.photos.map((entry) =>
    entry.id === photoId
      ? {
          ...entry,
          status: decision as "approved" | "rejected",
          reviewedAt: new Date().toISOString(),
          reviewedBy: staff.email,
          reviewNote: note || undefined,
        }
      : entry,
  );

  const completeness = computeCompleteness({
    applicant: application.applicant,
    spouse: application.spouse,
    children: application.children,
    contact: application.contact,
    household: application.household,
    photos,
  });

  await updateApplication(application.id, { photos, completeness });
  await addActivity({
    applicationId: application.id,
    type: decision === "approved" ? "photo_approved" : "photo_rejected",
    actorId: staff.uid,
    actorName: staff.email,
    visibility: "client",
    message:
      decision === "approved"
        ? `Foto për ${photo.memberName} u aprovua.`
        : `Foto për ${photo.memberName} u refuzua.${note ? ` Arsyeja: ${note}` : ""}`,
  });

  if (decision === "rejected") {
    await queueEmail({
      to: application.contact.email,
      type: "photo_rejected",
      locale: application.locale,
      applicationId: application.id,
      dedupeKey: `photo-rejected:${photo.id}`,
      context: {
        name: application.applicant.firstName,
        reference: application.ref,
        message: note || undefined,
        link: await portalLinkFor(application),
      },
    });
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: decision === "approved" ? "photo.approved" : "photo.rejected",
    entityType: "application",
    entityId: application.id,
    summary: `${photo.memberName}: ${decision}${note ? ` (${note.slice(0, 80)})` : ""}.`,
  });

  revalidateApplication(application.id);
  redirect(withParam(back, "notice", decision === "approved" ? "photo_approved" : "photo_rejected"));
}

export async function recordCashAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/payments/reconciliation");
  const staff = await requirePermission("payments.reconcile", formData);
  const orderId = String(formData.get("orderId") ?? "");
  const amountRaw = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const receivedAtRaw = String(formData.get("receivedAt") ?? "");
  const receivingMethod = String(formData.get("receivingMethod") ?? "office");
  const note = String(formData.get("note") ?? "").trim();

  if (!Number.isFinite(amountRaw) || amountRaw <= 0) {
    redirect(withParam(back, "error", "amount"));
  }
  const receivedAt = receivedAtRaw ? new Date(`${receivedAtRaw}T12:00:00Z`).toISOString() : new Date().toISOString();
  if (Number.isNaN(new Date(receivedAt).getTime())) {
    redirect(withParam(back, "error", "date"));
  }
  if (!["post", "office", "bank"].includes(receivingMethod)) {
    redirect(withParam(back, "error", "method"));
  }

  const order = await getOrder(orderId);
  if (!order) redirect(withParam(back, "error", "not_found"));

  let mismatch = false;
  try {
    const result = await recordCashPayment({
      orderId,
      receivedAmountCents: Math.round(amountRaw * 100),
      receivedAt,
      receivingMethod: receivingMethod as "post" | "office" | "bank",
      actor: { uid: staff.uid, email: staff.email },
      note,
    });
    mismatch = result.mismatch;
  } catch (error) {
    redirect(withParam(back, "error", (error as Error).message.includes("explanation") ? "note_required" : "payment"));
  }

  // A mismatch must be reviewed before the client is told payment is
  // confirmed. Otherwise an underpayment could trigger filing.
  const application = mismatch ? null : await getApplication(order.applicationId);
  if (application) {
    await queueEmail({
      to: application.contact.email,
      type: "payment_received",
      locale: application.locale,
      applicationId: application.id,
      dedupeKey: `payment-received:${order.id}`,
      context: {
        name: application.applicant.firstName,
        reference: application.ref,
        amountCents: order.amountCents,
        link: await portalLinkFor(application),
      },
    });
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "payment.cash_recorded",
    entityType: "order",
    entityId: order.id,
    summary: `Cash payment recorded for ${order.ref}.`,
    metadata: { amountCents: Math.round(amountRaw * 100), mismatch },
  });

  revalidateApplication(order.applicationId);
  redirect(withParam(back, "notice", mismatch ? "payment_mismatch" : "payment"));
}

export async function reviewPaymentMismatchAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/payments/reconciliation");
  const staff = await requirePermission("payments.reconcile", formData);
  const orderId = String(formData.get("orderId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (note.length < 5) redirect(withParam(back, "error", "note_required"));

  const order = await getOrder(orderId);
  if (!order) redirect(withParam(back, "error", "not_found"));

  try {
    await reviewPaymentMismatch({ orderId, note, actor: { uid: staff.uid, email: staff.email } });
  } catch {
    redirect(withParam(back, "error", "payment"));
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "payment.mismatch_reviewed",
    entityType: "order",
    entityId: order.id,
    summary: `Payment mismatch reviewed for ${order.ref}: ${note.slice(0, 120)}`,
  });

  revalidateApplication(order.applicationId);
  redirect(withParam(back, "notice", "payment_mismatch_reviewed"));
}

export async function refundAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/payments");
  const staff = await requirePermission("payments.refund", formData);
  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (reason.length < 5) redirect(withParam(back, "error", "reason_required"));

  const existing = await getOrder(orderId);
  if (!existing) redirect(withParam(back, "error", "not_found"));
  if (existing.method !== "cash") redirect(withParam(back, "error", "refund_provider"));

  try {
    const order = await refundOrder({ orderId, reason, actor: { uid: staff.uid, email: staff.email } });
    await logAudit({
      actor: { uid: staff.uid, email: staff.email },
      action: "payment.refunded",
      entityType: "order",
      entityId: order.id,
      summary: `Refund recorded: ${reason.slice(0, 120)}`,
    });
    revalidateApplication(order.applicationId);
    redirect(withParam(back, "notice", "refund"));
  } catch {
    redirect(withParam(back, "error", "refund"));
  }
}

export async function recordFilingAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/filing");
  const staff = await requirePermission("filing.file", formData);
  const applicationId = String(formData.get("applicationId") ?? "");
  const confirmationNumber = String(formData.get("confirmationNumber") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));
  if (application.status !== "ready_to_file") {
    redirect(withParam(back, "error", "not_ready"));
  }
  const order = await getOrderForApplication(application.id);
  const blockers = filingBlockers(application, order);
  if (blockers.includes("payment")) redirect(withParam(back, "error", "payment_required"));
  if (blockers.includes("amount_mismatch")) {
    redirect(withParam(back, "error", "payment_mismatch_unreviewed"));
  }
  if (blockers.length > 0) redirect(withParam(back, "error", "case_incomplete"));
  if (confirmationNumber.length < 6) {
    redirect(withParam(back, "error", "confirmation"));
  }

  const existing = await getFilingForApplication(application.id);
  if (existing) redirect(withParam(back, "error", "already_filed"));

  const filing = await recordFiling({
    applicationId: application.id,
    dvYear: application.dvYear,
    confirmationNumber,
    filedBy: { uid: staff.uid, email: staff.email },
    notes,
  });

  await updateApplication(application.id, { status: "filed", statusReason: undefined });
  await addActivity({
    applicationId: application.id,
    type: "filed",
    actorId: staff.uid,
    actorName: staff.email,
    visibility: "client",
    message:
      application.locale === "sq"
        ? "Aplikimi u dorëzua në faqen zyrtare. Numri i konfirmimit u regjistrua."
        : "The entry was filed on the official site. The confirmation number was recorded.",
  });

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "filing.recorded",
    entityType: "application",
    entityId: application.id,
    summary: `Filing recorded for ${application.ref}.`,
    metadata: { filingId: filing.id, dvYear: application.dvYear },
  });

  revalidateApplication(application.id);
  redirect(withParam(back, "notice", "filed"));
}

export async function sendConfirmationAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/filing");
  const staff = await requirePermission("filing.file", formData);
  const applicationId = String(formData.get("applicationId") ?? "");

  const application = await getApplication(applicationId);
  if (!application) redirect(withParam(back, "error", "not_found"));
  const filing = await getFilingForApplication(application.id);
  if (!filing) redirect(withParam(back, "error", "no_filing"));

  const notification = await queueEmail({
    to: application.contact.email,
    type: "filing_complete",
    locale: application.locale,
    applicationId: application.id,
    dedupeKey: `filing-complete:${filing.id}`,
    context: {
      name: application.applicant.firstName,
      reference: application.ref,
      confirmationNumber: filing.confirmationNumber,
      link: await portalLinkFor(application),
    },
  });

  const delivered = notification.status === "sent";
  if (delivered) {
    await updateApplication(application.id, { status: "confirmation_sent" });
    await addActivity({
      applicationId: application.id,
      type: "confirmation_queued",
      actorId: staff.uid,
      actorName: staff.email,
      visibility: "client",
      message:
        application.locale === "sq"
          ? "Njoftimi i konfirmimit u dërgua."
          : "The confirmation notification was sent.",
    });
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "filing.confirmation_queued",
    entityType: "application",
    entityId: application.id,
    summary: delivered ? "Confirmation email sent." : "Confirmation email not sent; message left in outbox.",
    metadata: { notificationStatus: notification.status },
  });

  revalidateApplication(application.id);
  if (notification.status === "not_configured") {
    redirect(withParam(back, "notice", "confirmation_outbox"));
  }
  if (!delivered) {
    redirect(withParam(back, "error", "email_failed"));
  }
  redirect(withParam(back, "notice", "confirmation"));
}

export async function resolveEditRequestAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/applications");
  const staff = await requirePermission("applications.transition", formData);
  const id = String(formData.get("id") ?? "");
  const status = formData.get("status") === "declined" ? "declined" : "resolved";

  await resolveEditRequest(id, status, staff.email);
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: `edit_request.${status}`,
    entityType: "edit_request",
    entityId: id,
    summary: `Edit request marked ${status}.`,
  });
  redirect(withParam(back, "notice", "edit_request"));
}

export async function updateDataRequestAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/data-requests");
  const staff = await requirePermission("data_requests.manage", formData);
  const id = String(formData.get("id") ?? "");
  const statusRaw = String(formData.get("status") ?? "open");
  const status = ["open", "in_progress", "completed", "declined"].includes(statusRaw)
    ? (statusRaw as "open" | "in_progress" | "completed" | "declined")
    : "open";
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000);

  await updateDataRequest(id, {
    status,
    notes: notes || null,
    handledBy: staff.email,
    completedAt: status === "completed" || status === "declined" ? new Date().toISOString() : null,
  });
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: `data_request.${status}`,
    entityType: "data_request",
    entityId: id,
    summary: `Data request moved to ${status}.`,
  });
  redirect(withParam(back, "notice", "data_request"));
}

export async function saveDvYearAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/dv-years");
  const staff = await requirePermission("dv.manage", formData);

  const year = Number(formData.get("year") ?? 0);
  const opensAt = String(formData.get("opensAt") ?? "");
  const closesAt = String(formData.get("closesAt") ?? "");
  const instructionsUrl = String(formData.get("instructionsUrl") ?? "").trim();
  const photoRulesVersion = String(formData.get("photoRulesVersion") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const activate = formData.get("activate") === "on";

  if (!Number.isInteger(year) || year < 2020 || year > 2100) {
    redirect(withParam(back, "error", "year"));
  }
  if (!opensAt || !closesAt || new Date(opensAt) >= new Date(closesAt)) {
    redirect(withParam(back, "error", "dates"));
  }
  if (!/^https:\/\/.+/.test(instructionsUrl)) {
    redirect(withParam(back, "error", "url"));
  }
  if (!photoRulesVersion) redirect(withParam(back, "error", "photo_rules"));

  const record = await upsertDvYear(
    {
      year,
      opensAt: new Date(opensAt).toISOString(),
      closesAt: new Date(closesAt).toISOString(),
      instructionsUrl,
      photoRulesVersion,
      notes: notes || null,
      active: activate,
    },
    staff.email,
  );
  if (activate) await setActiveDvYear(year, staff.email);

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "dv_year.saved",
    entityType: "dv_year",
    entityId: record.id,
    summary: `DV ${year} saved${activate ? " and activated" : ""}.`,
  });

  revalidatePath("/admin/dv-years");
  redirect(withParam(back, "notice", "saved"));
}

export async function activateDvYearAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/dv-years");
  const staff = await requirePermission("dv.manage", formData);
  const year = Number(formData.get("year") ?? 0);
  if (!Number.isInteger(year)) redirect(withParam(back, "error", "year"));

  await setActiveDvYear(year, staff.email);
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "dv_year.activated",
    entityType: "dv_year",
    entityId: String(year),
    summary: `DV ${year} activated.`,
  });
  revalidatePath("/admin/dv-years");
  redirect(withParam(back, "notice", "activated"));
}

const STAFF_ROLES: Role[] = ["admin", "operator", "accountant", "viewer"];

export async function addTeamMemberAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/team");
  const staff = await requirePermission("team.manage", formData);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "viewer") as Role;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) redirect(withParam(back, "error", "email"));
  if (!STAFF_ROLES.includes(roleRaw)) redirect(withParam(back, "error", "role"));

  const user = await upsertTeamMember({ email, name, role: roleRaw, actorEmail: staff.email });
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "team.member_saved",
    entityType: "user",
    entityId: user.id,
    summary: `Team member ${user.email} saved as ${user.role}.`,
  });
  revalidatePath("/admin/team");
  redirect(withParam(back, "notice", "member"));
}

export async function updateTeamMemberAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/team");
  const staff = await requirePermission("team.manage", formData);
  const userId = String(formData.get("userId") ?? "");
  const roleRaw = String(formData.get("role") ?? "") as Role;
  const active = formData.get("active") === "on";

  if (userId === staff.uid && (!active || roleRaw !== staff.role)) {
    redirect(withParam(back, "error", "self"));
  }
  if (!STAFF_ROLES.includes(roleRaw)) redirect(withParam(back, "error", "role"));

  const target = await findUserById(userId);
  if (!target) redirect(withParam(back, "error", "not_found"));

  if (target.role === "admin" && target.active && (!active || roleRaw !== "admin")) {
    const admins = await countActiveAdmins();
    if (admins <= 1) redirect(withParam(back, "error", "last_admin"));
  }

  await updateUserRecord(userId, { role: roleRaw, active });
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "team.member_updated",
    entityType: "user",
    entityId: userId,
    summary: `Role ${roleRaw}, active ${active}.`,
    metadata: { role: roleRaw, active },
  });
  revalidatePath("/admin/team");
  redirect(withParam(back, "notice", "member"));
}

export async function saveSettingsAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/settings");
  const staff = await requirePermission("settings.manage", formData);

  const prices = {
    individual: Math.round(Number(String(formData.get("priceIndividual") ?? "0").replace(",", ".")) * 100),
    couple: Math.round(Number(String(formData.get("priceCouple") ?? "0").replace(",", ".")) * 100),
    family: Math.round(Number(String(formData.get("priceFamily") ?? "0").replace(",", ".")) * 100),
  };
  if (Object.values(prices).some((price) => !Number.isFinite(price) || price <= 0)) {
    redirect(withParam(back, "error", "prices"));
  }

  const pricingRulesVersion = String(formData.get("pricingRulesVersion") ?? "").trim();
  if (!pricingRulesVersion) redirect(withParam(back, "error", "rules_version"));

  const cashDeadlineDays = Number(formData.get("cashDeadlineDays") ?? 7);
  if (!Number.isInteger(cashDeadlineDays) || cashDeadlineDays < 1 || cashDeadlineDays > 60) {
    redirect(withParam(back, "error", "deadline"));
  }

  const cashInstructionsSq = String(formData.get("cashInstructionsSq") ?? "").trim();
  const cashInstructionsEn = String(formData.get("cashInstructionsEn") ?? "").trim();
  if (cashInstructionsSq.length < 20 || cashInstructionsEn.length < 20) {
    redirect(withParam(back, "error", "instructions"));
  }

  const feeMode = String(formData.get("postSelectionFee") ?? "unresolved");
  const feeCents = Math.round(Number(String(formData.get("postSelectionFeeCents") ?? "0").replace(",", ".")) * 100);
  if (feeMode === "enabled" && (!Number.isFinite(feeCents) || feeCents <= 0)) {
    redirect(withParam(back, "error", "fee"));
  }

  await updateSettings(
    {
      prices,
      pricingRulesVersion,
      cashInstructionsSq,
      cashInstructionsEn,
      cashDeadlineDays,
      postSelectionFeeEnabled: feeMode === "unresolved" ? null : feeMode === "enabled",
      postSelectionFeeCents: feeMode === "enabled" ? feeCents : null,
      singleParentPricingApproved: formData.get("singleParentPricingApproved") === "on",
      spouseExclusionPricingApproved: formData.get("spouseExclusionPricingApproved") === "on",
      retentionApproved: formData.get("retentionApproved") === "on",
      legalCopyApproved: formData.get("legalCopyApproved") === "on",
    },
    { uid: staff.uid, email: staff.email },
  );

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "settings.updated",
    entityType: "settings",
    entityId: "main",
    summary: `Settings saved. Prices ${prices.individual}/${prices.couple}/${prices.family} cents.`,
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/launch-checklist");
  redirect(withParam(back, "notice", "saved"));
}

export async function retryEmailAction(formData: FormData): Promise<void> {
  const back = safePath(formData, "/admin/outbox");
  const staff = await requirePermission("settings.manage", formData);
  const notificationId = String(formData.get("notificationId") ?? "");

  if (!emailConfigured()) redirect(withParam(back, "error", "email_not_configured"));

  const result = await retryNotification(notificationId);
  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "notification.retry",
    entityType: "notification",
    entityId: notificationId,
    summary: result ? `Retry status: ${result.status}.` : "Notification not found.",
  });
  revalidatePath("/admin/outbox");
  redirect(withParam(back, "notice", "retry"));
}
