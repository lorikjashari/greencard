import type { NextRequest } from "next/server";
import { currentStaff } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/status/transitions";
import { listApplications } from "@/lib/repo/applications";
import { listOrders } from "@/lib/repo/orders";
import { listFilings } from "@/lib/repo/filings";
import { logAudit } from "@/lib/repo/audit";
import type { ApplicationStatus } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function csvEscape(value: unknown): string {
  const text = value == null ? "" : String(value);
  // Prevent spreadsheet formula execution when an exported cell is opened in
  // Excel/LibreOffice. The apostrophe is visible but not interpreted as code.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  if (/[",\n\r]/.test(safe)) return `"${safe.replaceAll('"', '""')}"`;
  return safe;
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\r\n");
}

export async function GET(request: NextRequest) {
  const staff = await currentStaff();
  if (!staff) {
    return new Response("Unauthorized", { status: 401, headers: { "cache-control": "no-store" } });
  }

  const type = request.nextUrl.searchParams.get("type") ?? "applications";
  if (type === "payments" && !hasPermission(staff.role, "payments.view")) {
    return new Response("Forbidden", { status: 403 });
  }
  if (type === "applications" && !hasPermission(staff.role, "applications.export")) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!["applications", "payments"].includes(type)) {
    return new Response("Unknown export type", { status: 400 });
  }

  const params = request.nextUrl.searchParams;
  let rows: Array<Record<string, unknown>> = [];
  let filename = "export.csv";

  if (type === "applications") {
    const statusParam = params.get("status") ?? "";
    const packageParam = params.get("package") ?? "";
    const applications = await listApplications({
      status: statusParam ? [statusParam as ApplicationStatus] : undefined,
      packageKey: packageParam || undefined,
      needsAttention: params.get("attention") === "1" || undefined,
      query: params.get("q") ?? undefined,
    });
    const payment = params.get("payment");
    const scoped = payment
      ? applications.filter((application) => application.paymentStatus === payment)
      : applications;
    const filings = await listFilings();
    const filingByApp = new Map(filings.map((filing) => [filing.applicationId, filing]));

    rows = scoped.map((application) => {
      const filing = filingByApp.get(application.id);
      return {
        reference: application.ref,
        status: application.status,
        payment_status: application.paymentStatus,
        package: application.packageKey,
        amount_eur: (application.amountCents / 100).toFixed(2),
        currency: application.currency,
        dv_year: application.dvYear,
        first_name: application.applicant.firstName,
        last_name: application.applicant.lastName,
        date_of_birth: application.applicant.dateOfBirth,
        email: application.contact.email,
        phone: application.contact.phone,
        city: application.contact.city,
        country: application.contact.country,
        submitted_at: application.submittedAt ?? "",
        confirmation_number: filing?.confirmationNumber ?? "",
        filed_at: filing?.filedAt ?? "",
        completeness_data: application.completeness.dataComplete ? "yes" : "no",
        completeness_photos: application.completeness.photosApproved ? "yes" : "no",
        duplicate: application.duplicate.level,
        pricing_rules_version: application.pricingRulesVersion,
      };
    });
    filename = `gck-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    const orders = await listOrders();
    const applications = await listApplications();
    const apps = new Map(applications.map((application) => [application.id, application]));
    const statusParam = params.get("status");
    const methodParam = params.get("method");
    const scoped = orders
      .filter((order) => (statusParam ? order.status === statusParam : true))
      .filter((order) => (methodParam ? order.method === methodParam : true));

    rows = scoped.map((order) => ({
      order_reference: order.ref,
      application_reference: apps.get(order.applicationId)?.ref ?? "",
      amount_eur: (order.amountCents / 100).toFixed(2),
      received_eur:
        order.receivedAmountCents != null ? (order.receivedAmountCents / 100).toFixed(2) : "",
      currency: order.currency,
      method: order.method,
      status: order.status,
      created_at: order.createdAt,
      paid_at: order.paidAt ?? "",
      received_at: order.receivedAt ?? "",
      received_by: order.receivedBy ?? "",
      receiving_method: order.receivingMethod ?? "",
      amount_mismatch: order.amountMismatch ? "yes" : "no",
      refunded_at: order.refundedAt ?? "",
      refund_reason: order.refundReason ?? "",
      provider: order.provider,
      provider_ref: order.providerRef ?? "",
    }));
    filename = `gck-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  }

  await logAudit({
    actor: { uid: staff.uid, email: staff.email },
    action: "export.generated",
    entityType: "export",
    entityId: type,
    summary: `${rows.length} rows exported (${type}).`,
    metadata: { type, rows: rows.length },
  });

  const csv = `\uFEFF${toCsv(rows)}`;
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
