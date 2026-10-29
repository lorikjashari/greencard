import { requestDataAction } from "@/app/[locale]/account/actions";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";

export function DataRequestForm({
  locale,
  t,
  applicationId,
}: {
  locale: Locale;
  t: Copy;
  applicationId?: string;
}) {
  return (
    <form action={requestDataAction} className="space-y-2.5">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value="access" />
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}
      <label className="sr-only" htmlFor={`data-message-${applicationId ?? "account"}`}>
        {t.account.requestData}
      </label>
      <textarea
        id={`data-message-${applicationId ?? "account"}`}
        name="message"
        rows={2}
        maxLength={2000}
        className="field text-[13px]"
        placeholder={
          locale === "sq"
            ? "Përshkruaj çfarë të dhënash kërkon (opsionale)."
            : "Describe which data you are requesting (optional)."
        }
      />
      <button type="submit" className="btn-secondary btn-sm w-full">
        {t.account.requestData}
      </button>
    </form>
  );
}
