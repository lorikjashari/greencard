import type { ApplicationRecord, OrderRecord } from "@/lib/types";

export type FilingBlockerCode = "payment" | "amount_mismatch" | "data" | "photo";

/**
 * Authoritative pre-filing checks. The filing workspace renders these codes,
 * and server actions re-run them so a crafted form cannot bypass the UI.
 */
export function filingBlockers(
  application: Pick<
    ApplicationRecord,
    "status" | "paymentStatus" | "completeness" | "photos" | "household" | "spouse" | "children"
  >,
  order: Pick<OrderRecord, "status" | "amountMismatch" | "mismatchReviewedAt"> | null,
): FilingBlockerCode[] {
  const blockers: FilingBlockerCode[] = [];

  if (application.paymentStatus !== "paid" || !order || order.status !== "paid") {
    blockers.push("payment");
  } else if (order.amountMismatch && !order.mismatchReviewedAt) {
    blockers.push("amount_mismatch");
  }

  if (!application.completeness.dataComplete) blockers.push("data");

  const required = ["applicant"];
  if (application.household.spouseIncluded && application.spouse) required.push("spouse");
  for (const child of application.children) required.push(`child:${child.id}`);

  const byMember = new Map(application.photos.map((photo) => [photo.memberKey, photo]));
  const photosReviewed = required.every((member) => byMember.get(member)?.status === "approved");
  if (!photosReviewed) blockers.push("photo");

  return blockers;
}
