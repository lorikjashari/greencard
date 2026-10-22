import type { Metadata } from "next";
import { ShieldCheck, Users } from "lucide-react";
import { requireAdminPage } from "@/lib/admin/guard";
import { adminLocale } from "@/lib/admin/locale";
import { copy } from "@/messages/get";
import { listUsers } from "@/lib/repo/users";
import { formatDateTime } from "@/lib/format";
import { AdminPageHeader, AdminNotice, SectionCard } from "@/components/admin/ui";
import { addTeamMemberAction, updateTeamMemberAction } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

const ROLES = ["admin", "operator", "accountant", "viewer"] as const;

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const staff = await requireAdminPage("team.manage");
  const locale = await adminLocale();
  const t = copy(locale);
  const tx = (sq: string, en: string) => (locale === "sq" ? sq : en);
  const { notice, error } = await searchParams;

  const users = await listUsers();
  const team = users.filter((user) => user.role !== "client");
  const clients = users.filter((user) => user.role === "client");

  return (
    <div>
      <AdminPageHeader
        title={t.admin.nav.team}
        description={tx(
          "Rolet dhe aksesi. Ndryshimet zbatohen menjëherë; çdo veprim regjistrohet në audit.",
          "Roles and access. Changes take effect immediately; every action is written to the audit log.",
        )}
      />

      <AdminNotice locale={locale} notice={notice} error={error} />

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <SectionCard
          title={tx("Stafi", "Staff")}
          description={`${team.filter((user) => user.active).length} ${tx("aktiv", "active")} / ${team.length} ${tx("gjithsej", "total")}`}
        >
          <ul className="divide-y divide-line">
            {team.map((user) => (
              <li key={user.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                      <ShieldCheck className="h-3.5 w-3.5 text-forest" aria-hidden="true" />
                      {user.name}
                      {user.id === staff.uid && (
                        <span className="chip border-forest-200 bg-forest-50 text-forest-700">{tx("Ti", "You")}</span>
                      )}
                    </p>
                    <p className="truncate text-2xs text-muted">{user.email}</p>
                    <p className="mt-0.5 text-2xs text-muted">
                      {tx("Hyrja e fundit", "Last sign-in")}: {formatDateTime(user.lastSignInAt, locale)}
                    </p>
                  </div>

                  <form action={updateTeamMemberAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="userId" value={user.id} />
                    <div>
                      <label className="label" htmlFor={`role-${user.id}`}>
                        {tx("Roli", "Role")}
                      </label>
                      <select
                        id={`role-${user.id}`}
                        name="role"
                        defaultValue={user.role}
                        className="field w-36"
                        disabled={user.id === staff.uid}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </div>
                    <label className="mb-2 inline-flex items-center gap-1.5 text-2xs text-ink">
                      <input
                        type="checkbox"
                        name="active"
                        className="h-3.5 w-3.5"
                        defaultChecked={user.active}
                        disabled={user.id === staff.uid}
                      />
                      {tx("Aktiv", "Active")}
                    </label>
                    <button type="submit" className="btn-secondary btn-sm" disabled={user.id === staff.uid}>
                      {t.common.save}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-2 text-2xs leading-5 text-muted">
            {tx(
              "Nuk mund të ndryshosh rolin ose të çaktivizosh veten. Duhet të mbetet gjithmonë një administrator aktiv.",
              "You cannot change your own role or deactivate yourself. At least one active administrator must remain.",
            )}
          </p>
        </SectionCard>

        <div className="space-y-5">
          <SectionCard title={tx("Shto anëtar stafi", "Add staff member")}>
            <form action={addTeamMemberAction} className="space-y-3">
              <div>
                <label className="label" htmlFor="email">
                  {t.common.email}
                </label>
                <input id="email" name="email" type="email" className="field" required autoComplete="off" />
              </div>
              <div>
                <label className="label" htmlFor="name">
                  {tx("Emri", "Name")}
                </label>
                <input id="name" name="name" className="field" maxLength={120} />
              </div>
              <div>
                <label className="label" htmlFor="role">
                  {tx("Roli", "Role")}
                </label>
                <select id="role" name="role" className="field" defaultValue="operator">
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary btn-sm">
                {t.common.add}
              </button>
              <p className="text-2xs leading-5 text-muted">
                {tx(
                  "Anëtari identifikohet me emailin e tij përmes Firebase ose lidhjes magjike. Nuk dërgohet fjalëkalim. Në demo, vetëm llogaritë e seed-uar mund të hyjnë.",
                  "The member identifies with their email through Firebase or a magic link. No password is sent. In demo, only seeded accounts can sign in.",
                )}
              </p>
            </form>
          </SectionCard>

          <SectionCard title={tx("Klientët", "Clients")} description={`${clients.length} ${tx("llogari", "accounts")}`}>
            {clients.length === 0 ? (
              <p className="text-2xs text-muted">{tx("Nuk ka llogari klientësh.", "No client accounts.")}</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {clients.map((user) => (
                  <li key={user.id} className="flex items-start gap-2 text-2xs">
                    <Users className="mt-0.5 h-3 w-3 text-muted" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-ink">{user.email}</span>
                      <span className="text-muted">
                        {user.active ? tx("aktiv", "active") : tx("pasiv", "inactive")} ·{" "}
                        {tx("krijuar", "created")} {formatDateTime(user.createdAt, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
