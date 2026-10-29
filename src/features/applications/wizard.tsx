"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CloudOff,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
} from "lucide-react";
import {
  StepApplicant,
  StepChildren,
  StepContact,
  StepHousehold,
  StepPayment,
  StepPhotos,
  StepReview,
  StepSpouse,
  type StepProps,
} from "./wizard-steps";
import { resolveTier } from "@/lib/pricing/calculate-tier";
import { tierWarningText } from "@/messages/tier-warnings";
import { requiredPhotoMembers, validateAllSteps, validateStep, type WizardErrors } from "@/lib/validation/wizard";
import { formatCurrency } from "@/lib/format";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import type { DraftData, PackageKey } from "@/lib/types";
import { cn } from "@/lib/cn";

type SaveState = "idle" | "saving" | "saved" | "error" | "offline";

const CONSENT_TYPES: Record<string, string> = {
  terms: "terms",
  privacy: "privacy",
  immediatePerformance: "immediate_performance",
  accuracy: "accuracy",
  independentService: "independent_service",
  guardian: "guardian",
};

function stepForErrorKey(key: string): number {
  if (key.startsWith("household.")) return 1;
  if (key.startsWith("applicant.")) return 2;
  if (key.startsWith("spouse.")) return 3;
  if (key.startsWith("children.")) return 4;
  if (key.startsWith("contact.")) return 5;
  if (key.startsWith("photo.")) return 6;
  if (key.startsWith("consents.")) return 7;
  if (key === "paymentMethod") return 8;
  return 1;
}

export function ApplicationWizard({
  locale,
  t,
  cardEnabled,
  demo,
  prices,
  rulesVersion,
  policyVersion,
  handoff,
}: {
  locale: Locale;
  t: Copy;
  cardEnabled: boolean;
  demo: boolean;
  prices: Record<PackageKey, number>;
  rulesVersion: string;
  policyVersion: string;
  handoff?: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [bootError, setBootError] = useState<string | null>(null);
  const [data, setData] = useState<DraftData | null>(null);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<WizardErrors>({});
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const draftRef = useRef<{ id: string; secret: string; version: number } | null>(null);
  const dataRef = useRef<DraftData | null>(null);
  const stepRef = useRef(1);
  const versionRef = useRef(1);
  const booted = useRef(false);
  const saving = useRef(false);
  const dirty = useRef(false);
  const timer = useRef<number | null>(null);
  const topRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<() => Promise<void>>(async () => undefined);

  dataRef.current = data;
  stepRef.current = step;

  const bootstrap = useCallback(
    async (source: "auto" | "retry") => {
      setPhase("loading");
      setBootError(null);
      try {
        let payload: {
          ok: boolean;
          draft?: { id: string; secret: string; version: number; step: number; data: DraftData };
          error?: string;
        };

        if (source === "auto" && handoff) {
          const response = await fetch("/api/drafts/resume", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ handoff }),
          });
          payload = (await response.json()) as typeof payload;
          if (!payload.ok) throw new Error(payload.error ?? "resume_failed");
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          const stored = readStoredDraft();
          if (source === "auto" && stored) {
            const response = await fetch("/api/drafts/load", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(stored),
            });
            payload = (await response.json()) as typeof payload;
          } else {
            const response = await fetch("/api/drafts", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ locale }),
            });
            payload = (await response.json()) as typeof payload;
          }
        }

        if (!payload.ok || !payload.draft) {
          throw new Error(payload.error ?? t.errors.generic);
        }

        draftRef.current = {
          id: payload.draft.id,
          secret: payload.draft.secret,
          version: payload.draft.version,
        };
        versionRef.current = payload.draft.version;
        storeDraft({ id: payload.draft.id, secret: payload.draft.secret });
        setData(payload.draft.data);
        setStep(Math.min(8, Math.max(1, payload.draft.step || 1)));
        setPhase("ready");
      } catch (error) {
        setBootError((error as Error).message || t.errors.generic);
        setPhase("error");
      }
    },
    [handoff, locale, t.errors.generic],
  );

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    void bootstrap("auto");
  }, [bootstrap]);

  const save = useCallback(async () => {
    const draft = draftRef.current;
    const current = dataRef.current;
    if (!draft || !current) return;

    if (saving.current) {
      dirty.current = true;
      return;
    }
    saving.current = true;
    dirty.current = false;
    setSaveState("saving");

    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: draft.secret,
          data: current,
          step: stepRef.current,
          version: versionRef.current,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; version?: number; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "save_failed");
      }
      if (typeof payload.version === "number") {
        versionRef.current = payload.version;
        draftRef.current = { ...draft, version: payload.version };
      }
      setSaveState("saved");
    } catch {
      setSaveState(typeof navigator !== "undefined" && !navigator.onLine ? "offline" : "error");
    } finally {
      saving.current = false;
      if (dirty.current) {
        dirty.current = false;
        window.setTimeout(() => void saveRef.current(), 250);
      }
    }
  }, []);

  saveRef.current = save;

  const firstRender = useRef(true);
  useEffect(() => {
    if (phase !== "ready") return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void saveRef.current(), 900);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [data, step, phase]);

  useEffect(() => {
    function onOnline() {
      setSaveState((current) => (current === "offline" ? "idle" : current));
      void saveRef.current();
    }
    function onOffline() {
      setSaveState("offline");
    }
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (submitting || saveState === "error" || saveState === "offline") {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveState, submitting]);

  const tier = useMemo(() => {
    if (!data) return null;
    return resolveTier(
      {
        maritalStatus: data.household.maritalStatus,
        spouseIncluded: data.household.spouseIncluded,
        children: data.children.map((child) => ({ dateOfBirth: child.dateOfBirth, married: child.married })),
        entryDate: new Date().toISOString().slice(0, 10),
      },
      { prices, rulesVersion },
    );
  }, [data, prices, rulesVersion]);

  function focusTop() {
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
      topRef.current?.focus({ preventScroll: true });
    });
  }

  function focusFirstError() {
    window.requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
      target?.focus({ preventScroll: true });
    });
  }

  function goNext() {
    if (!data) return;
    setSubmitError(null);
    const found = validateStep(step, data, locale, { cardEnabled });
    setErrors(found);
    if (Object.keys(found).length > 0) {
      focusFirstError();
      return;
    }
    if (step < 8) {
      setStep(step + 1);
      focusTop();
    } else {
      void submit();
    }
  }

  function goBack() {
    if (step > 1) {
      setErrors({});
      setStep(step - 1);
      focusTop();
    }
  }

  function goTo(target: number) {
    if (target < 1 || target > 8 || target === step) return;
    if (target > step) return;
    setErrors({});
    setStep(target);
    focusTop();
  }

  async function submit() {
    if (!data || !draftRef.current) return;

    const allErrors = validateAllSteps(data, locale, { cardEnabled });
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstStep = Math.min(...Object.keys(allErrors).map(stepForErrorKey));
      setStep(firstStep);
      setSubmitError(t.apply.submitError);
      focusFirstError();
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const allowed = new Set(requiredPhotoMembers(data));
    const consents = Object.entries(data.consents)
      .filter(([, accepted]) => accepted)
      .map(([key]) => ({
        type: CONSENT_TYPES[key] ?? key,
        policyVersion,
        acceptedAt: new Date().toISOString(),
        locale,
      }));

    const payload = {
      household: data.household,
      applicant: data.applicant,
      spouse: data.household.maritalStatus === "married" && data.household.spouseIncluded ? data.spouse : null,
      children: data.children,
      contact: data.contact,
      consents,
      photos: Object.values(data.photos)
        .filter((photo) => allowed.has(photo.memberKey))
        .map((photo) => ({
          id: photo.id,
          memberKey: photo.memberKey,
          storageKey: photo.storageKey,
          status: photo.status,
          bytes: photo.bytes,
          width: photo.width,
          height: photo.height,
          contentType: photo.contentType,
        })),
      paymentMethod: data.paymentMethod,
      policyVersion,
      draftId: draftRef.current.id,
      draftSecret: draftRef.current.secret,
    };

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as {
        ok: boolean;
        error?: string;
        portalLink?: string | null;
        checkoutUrl?: string | null;
        fieldErrors?: Record<string, string>;
      };

      if (!response.ok || !result.ok) {
        setSubmitting(false);
        setSubmitError(result.error ?? t.apply.submitError);
        if (result.fieldErrors) {
          setErrors(result.fieldErrors);
          focusFirstError();
        }
        return;
      }

      clearStoredDraft();
      if (result.portalLink) {
        window.sessionStorage.setItem("gck_demo_portal", result.portalLink);
      }
      if (result.checkoutUrl) {
        window.location.assign(result.checkoutUrl);
        return;
      }
      router.push(`/${locale}/apply/complete`);
    } catch {
      setSubmitting(false);
      setSubmitError(t.errors.network);
    }
  }

  if (phase === "loading") {
    return (
      <div className="container-page py-10" aria-busy="true" aria-live="polite">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-clay" aria-hidden="true" />
            <div className="skeleton h-3 w-24" />
          </div>
          <div className="mt-6 skeleton h-9 w-2/3" />
          <div className="mt-3 skeleton h-3 w-1/2" />
          <div className="mt-8 space-y-4">
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-11 w-full" />
            <div className="skeleton h-28 w-full" />
          </div>
          <p className="mt-6 meta text-[10px]">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  if (phase === "error" || !data) {
    return (
      <div className="container-page py-16">
        <div className="mx-auto max-w-md border border-line bg-paper p-7">
          <AlertCircle className="h-5 w-5 text-danger" aria-hidden="true" />
          <h1 className="display mt-3 text-[24px] leading-tight">{t.errors.generic}</h1>
          <p className="mt-2 text-[13px] leading-6 text-muted">{bootError}</p>
          <button type="button" onClick={() => void bootstrap("retry")} className="btn-primary mt-5">
            {t.common.retry}
          </button>
        </div>
      </div>
    );
  }

  const stepLabels = [
    t.apply.step1,
    t.apply.step2,
    t.apply.step3,
    t.apply.step4,
    t.apply.step5,
    t.apply.step6,
    t.apply.step7,
    t.apply.step8,
  ];

  const stepProps: StepProps = {
    data,
    setData: (updater) => setData((current) => (current ? updater(current) : current)),
    errors,
    locale,
    t,
    demo,
  };

  const currentLabel = stepLabels[step - 1];
  const stepOfLabel = t.apply.stepOf.replace("{current}", String(step)).replace("{total}", "8");

  return (
    <div className="container-page py-6 lg:py-10">
      {/* Single accessible progress indicator for the whole wizard. */}
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={8}
        aria-label={t.apply.progress}
        className="sr-only"
      >
        {stepOfLabel}
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        <aside className="lg:self-start">
          {/* Mobile: a single line of progress, no decoration. */}
          <div className="lg:hidden">
            <div className="flex items-baseline justify-between gap-3">
              <p className="meta text-[10px] text-forest-700">{stepOfLabel}</p>
              <SaveIndicator state={saveState} t={t} />
            </div>
            <div className="mt-2 h-[3px] w-full bg-line" aria-hidden="true">
              <div className="h-full bg-forest transition-all duration-300 ease-out" style={{ width: `${(step / 8) * 100}%` }} />
            </div>
            <p className="mt-2 font-serif text-[19px] leading-none text-forest-900">{currentLabel}</p>
          </div>

          {/* Desktop: the step ledger stays in view for the whole application. */}
          <div className="hidden lg:sticky lg:top-24 lg:block">
            <div className="flex items-baseline justify-between gap-3">
              <p className="eyebrow-muted text-[10px]">{t.apply.progress}</p>
              <p className="font-mono text-[10px] tabular text-muted">
                {String(step).padStart(2, "0")} / 08
              </p>
            </div>

            <ol className="mt-4 border-t border-line" aria-label={t.apply.progress}>
              {stepLabels.map((label, index) => {
                const number = index + 1;
                const done = number < step;
                const active = number === step;
                return (
                  <li key={label} className="border-b border-line">
                    <button
                      type="button"
                      onClick={() => goTo(number)}
                      disabled={number >= step}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "group flex w-full items-center gap-3 py-2.5 text-left transition-colors",
                        number < step && "cursor-pointer hover:text-clay-600",
                        number >= step && "cursor-default",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-4 w-4 shrink-0 place-items-center border",
                          active && "border-forest bg-forest text-paper",
                          done && "border-forest-300 bg-forest-50 text-forest-700",
                          !active && !done && "border-line-strong bg-transparent text-transparent",
                        )}
                        aria-hidden="true"
                      >
                        {active ? (
                          <span className="h-1.5 w-1.5 bg-paper" />
                        ) : (
                          <svg viewBox="0 0 10 10" className={cn("h-2.5 w-2.5", done ? "opacity-100" : "opacity-0")}>
                            <path d="M1.5 5.2 4 7.5 8.5 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-[13px] leading-5",
                            active ? "font-semibold text-ink" : done ? "text-ink/75" : "text-muted/70",
                          )}
                        >
                          {label}
                        </span>
                      </span>
                      <span className="font-mono text-3xs tabular text-muted/60" aria-hidden="true">
                        {String(number).padStart(2, "0")}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>

            <div className="mt-5">
              <PriceCard tier={tier} t={t} locale={locale} />
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 border-t border-line pt-3">
              <SaveIndicator state={saveState} t={t} />
            </div>

            <p className="mt-4 flex items-start gap-2 text-[11px] leading-5 text-muted">
              <Lock className="mt-0.5 h-3 w-3 shrink-0 text-forest-600" aria-hidden="true" />
              {t.apply.emailHelp}
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <div ref={topRef} tabIndex={-1} className="scroll-mt-24 border border-line bg-paper p-5 focus:outline-none sm:p-7 lg:p-9">
            {step === 1 && <StepHousehold {...stepProps} />}
            {step === 2 && <StepApplicant {...stepProps} />}
            {step === 3 && <StepSpouse {...stepProps} />}
            {step === 4 && <StepChildren {...stepProps} />}
            {step === 5 && <StepContact {...stepProps} />}
            {step === 6 && (
              <StepPhotos
                {...stepProps}
                draftId={draftRef.current?.id ?? ""}
                draftSecret={draftRef.current?.secret ?? ""}
              />
            )}
            {step === 7 && <StepReview {...stepProps} goTo={goTo} />}
            {step === 8 && (
              <StepPayment
                {...stepProps}
                cardEnabled={cardEnabled}
                tier={tier?.tier ?? null}
                priceCents={tier?.priceCents ?? null}
              />
            )}
          </div>

          {submitError && (
            <div
              role="alert"
              className="mt-5 flex items-start gap-2 border-l-2 border-danger bg-danger-50 px-4 py-3 text-[13px] leading-6 text-danger"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="mt-6 lg:hidden">
            <PriceCard tier={tier} t={t} locale={locale} compact />
          </div>

          {/* On phones the primary action stays reachable while the form scrolls. */}
          <div className="sticky bottom-0 z-20 -mx-5 mt-6 flex flex-col-reverse items-stretch gap-3 border-t border-line bg-ivory px-5 py-3 sm:-mx-7 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-4 lg:static lg:mx-0 lg:border-t lg:bg-transparent lg:px-0 lg:pt-5">
            <button type="button" onClick={goBack} disabled={step === 1 || submitting} className="btn-secondary sm:w-auto">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {t.common.back}
            </button>

            <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
              <span className="hidden text-2xs text-muted sm:inline">{t.apply.savedLocally}</span>
              <button type="button" onClick={goNext} disabled={submitting} className="btn-primary sm:min-w-44">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t.apply.submitting}
                  </>
                ) : step === 8 ? (
                  <>
                    <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                    {t.common.submit}
                  </>
                ) : (
                  <>
                    {t.common.continue}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

function PriceCard({
  tier,
  t,
  locale,
  compact = false,
}: {
  tier: ReturnType<typeof resolveTier> | null;
  t: Copy;
  locale: Locale;
  compact?: boolean;
}) {
  const label = tier?.tier
    ? tier.tier === "individual"
      ? t.common.pkgIndividual
      : tier.tier === "couple"
        ? t.common.pkgCouple
        : t.common.pkgFamily
    : null;

  return (
    <div className={cn("border border-line bg-ivory/70 p-4", !compact && "bg-paper")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow-muted text-[10px]">{t.apply.priceTitle}</p>
          <p className="mt-1.5 truncate text-[13px] font-medium text-ink">{label ?? t.apply.pricePending}</p>
        </div>
        {tier?.priceCents != null && (
          <p className="whitespace-nowrap font-serif text-[22px] leading-none tabular text-forest-900">
            {formatCurrency(tier.priceCents, locale)}
          </p>
        )}
      </div>
      <p className="mt-2 text-[11px] leading-4 text-muted">{t.apply.priceCalculated}</p>

      {tier && tier.warnings.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-line pt-3">
          {tier.warnings.map((warning) => (
            <p key={`${warning.code}-${warning.count ?? ""}`} className="flex gap-1.5 text-[11px] leading-4 text-warning">
              <AlertCircle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
              {tierWarningText(locale, warning)}
            </p>
          ))}
          {tier.needsReview && (
            <p className="text-[11px] font-medium leading-4 text-warning">{t.apply.reviewPolicyNote}</p>
          )}
        </div>
      )}
    </div>
  );
}

function SaveIndicator({ state, t }: { state: SaveState; t: Copy }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-muted" aria-live="polite">
        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        {t.common.saving}
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-success" aria-live="polite">
        <Check className="h-3 w-3" aria-hidden="true" />
        {t.common.saved}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-danger" role="alert">
        <AlertCircle className="h-3 w-3" aria-hidden="true" />
        {t.apply.saveFailed}
      </span>
    );
  }
  if (state === "offline") {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-warning" role="status">
        <CloudOff className="h-3 w-3" aria-hidden="true" />
        {t.apply.offline}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-2xs text-muted">
      <Save className="h-3 w-3" aria-hidden="true" />
      {t.apply.savedLocally}
    </span>
  );
}

const STORAGE_KEY = "gck_draft_v1";

function readStoredDraft(): { id: string; secret: string } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { id?: string; secret?: string };
    if (!parsed.id || !parsed.secret) return null;
    return { id: parsed.id, secret: parsed.secret };
  } catch {
    return null;
  }
}

function storeDraft(value: { id: string; secret: string }) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* storage may be full or blocked; the server copy still exists */
  }
}

function clearStoredDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
