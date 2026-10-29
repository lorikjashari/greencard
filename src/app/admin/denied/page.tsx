import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { copy } from "@/messages/get";
import { adminLocale } from "@/lib/admin/locale";

export const dynamic = "force-dynamic";

export default async function AdminDeniedPage() {
  const locale = await adminLocale();
  const t = copy(locale);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ivory px-4">
      <div className="w-full max-w-md border border-line bg-paper p-8 text-center ">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm border border-danger/40 bg-danger-50 text-danger">
          <ShieldAlert className="h-5 w-5" aria-hidden="true" />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">{t.admin.noPermission}</h1>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          {locale === "sq"
            ? "Roli i llogarisë nuk lejon këtë faqe. Kontakto administratorin nëse mendon se ka gabim."
            : "Your account role does not allow this page. Contact an administrator if you believe this is a mistake."}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/admin" className="btn-primary btn-sm">
            {t.admin.nav.overview}
          </Link>
          <Link href="/admin/login" className="btn-secondary btn-sm">
            {t.admin.signOut}
          </Link>
        </div>
      </div>
    </div>
  );
}
