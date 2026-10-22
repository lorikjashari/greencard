"use client";

import { requestEditAction } from "@/app/[locale]/account/actions";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";

export function EditRequestForm({
  locale,
  t,
  applicationId,
}: {
  locale: Locale;
  t: Copy;
  applicationId: string;
}) {
  return (
    <form action={requestEditAction} className="space-y-3">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <label className="label" htmlFor={`edit-message-${applicationId}`}>
          {t.account.editRequest}
        </label>
        <textarea
          id={`edit-message-${applicationId}`}
          name="message"
          rows={3}
          required
          minLength={5}
          maxLength={2000}
          className="field"
          placeholder={t.account.editRequestPlaceholder}
        />
      </div>
      <button type="submit" className="btn-secondary btn-sm">
        {t.account.editRequest}
      </button>
    </form>
  );
}
