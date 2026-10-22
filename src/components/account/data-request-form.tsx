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
    <form action={requestDataAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="type" value="access" />
      {applicationId && <input type="hidden" name="applicationId" value={applicationId} />}
      <div>
        <label className="label" htmlFor={`data-message-${applicationId ?? "account"}`}>
          {t.account.requestData}
        </label>
        <textarea
          id={`data-message-${applicationId ?? "account"}`}
          name="message"
          rows={3}
          maxLength={2000}
          className="field"
          placeholder={
            locale === "sq"
              ? "Përshkruaj çfarë të dhënash kërkon (opsionale)."
              : "Describe which data you are requesting (optional)."
          }
        />
      </div>
      <button type="submit" className="btn-secondary btn-sm">
        {t.account.requestData}
      </button>
    </form>
  );
}
