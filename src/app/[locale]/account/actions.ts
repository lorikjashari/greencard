"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getApplication, addActivity } from "@/lib/repo/applications";
import { createDataRequest, createEditRequest } from "@/lib/repo/requests";
import { logAudit } from "@/lib/repo/audit";

async function ownedApplication(applicationId: string) {
  const session = await getSession();
  if (!session || session.role !== "client") return { session: null, application: null };
  const application = await getApplication(applicationId);
  if (!application || application.ownerEmail !== session.email) {
    return { session, application: null };
  }
  return { session, application };
}

export async function requestEditAction(formData: FormData): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "");
  const message = String(formData.get("message") ?? "").trim();
  const locale = formData.get("locale") === "en" ? "en" : "sq";
  const { session, application } = await ownedApplication(applicationId);

  if (!session) redirect(`/${locale}/login`);
  if (!application) redirect(`/${locale}/account`);
  if (message.length < 5) {
    redirect(`/${locale}/account/${applicationId}?error=edit_short`);
  }
  if (["cancelled", "rejected", "expired"].includes(application.status)) {
    redirect(`/${locale}/account/${applicationId}?error=edit_closed`);
  }

  await createEditRequest({ applicationId, message });

  await addActivity({
    applicationId,
    type: "edit_requested",
    actorId: session.uid,
    actorName: session.name,
    visibility: "internal",
    message: `Klienti kërkoi ndryshim: ${message}`,
  });
  await addActivity({
    applicationId,
    type: "client_message",
    actorId: session.uid,
    actorName: session.name,
    visibility: "client",
    message: "Kërkesa për ndryshim u regjistrua. Stafi do të kontaktojë.",
  });
  await logAudit({
    actor: { uid: session.uid, email: session.email },
    action: "client.edit_requested",
    entityType: "application",
    entityId: applicationId,
    summary: "Client requested a change.",
  });

  redirect(`/${locale}/account/${applicationId}?notice=edit`);
}

export async function requestDataAction(formData: FormData): Promise<void> {
  const applicationId = String(formData.get("applicationId") ?? "") || null;
  const typeValue = String(formData.get("type") ?? "access");
  const type = typeValue === "deletion" ? "deletion" : typeValue === "correction" ? "correction" : "access";
  const message = String(formData.get("message") ?? "").trim();
  const locale = formData.get("locale") === "en" ? "en" : "sq";

  const session = await getSession();
  if (!session || session.role !== "client") redirect(`/${locale}/login`);

  if (applicationId) {
    const application = await getApplication(applicationId);
    if (!application || application.ownerEmail !== session.email) {
      redirect(`/${locale}/account`);
    }
  }

  await createDataRequest({
    applicationId,
    email: session.email,
    type,
    message:
      message ||
      (locale === "sq"
        ? "Kërkesë për të drejtat e të dhënave nga portali i klientit."
        : "Data-rights request from the client portal."),
  });
  await logAudit({
    actor: { uid: session.uid, email: session.email },
    action: `client.data_request_${type}`,
    entityType: "data_request",
    entityId: applicationId ?? session.email,
    summary: `Client submitted a ${type} request.`,
  });

  redirect(
    applicationId
      ? `/${locale}/account/${applicationId}?notice=data`
      : `/${locale}/account?notice=data`,
  );
}
