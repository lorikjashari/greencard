"use client";

import { useMemo } from "react";
import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { Field, describedBy } from "@/components/ui/field";
import { PhotoTile } from "@/features/applications/photo-tile";
import { countryName, countryOptions } from "@/lib/countries";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import type { ChildData, DraftData, MaritalStatus, PackageKey, PersonData } from "@/lib/types";

export interface StepProps {
  data: DraftData;
  setData: (updater: (current: DraftData) => DraftData) => void;
  errors: Record<string, string>;
  locale: Locale;
  t: Copy;
  demo: boolean;
}


/**
 * One heading treatment for all eight steps: the step counter, a serif title
 * and a short brief. Keeps the wizard from drifting step to step.
 */
export function StepHeading({
  index,
  title,
  intro,
  t,
}: {
  index: number;
  title: string;
  intro: string;
  t: Copy;
}) {
  return (
    <header className="border-b border-line pb-5">
      <p className="eyebrow-muted text-[10px]">
        {t.apply.stepOf.replace("{current}", String(index)).replace("{total}", "8")}
      </p>
      <h2 className="display mt-2.5 text-[26px] leading-[1.15] sm:text-[30px]">{title}</h2>
      <p className="mt-2.5 max-w-2xl text-[13.5px] leading-6 text-muted">{intro}</p>
    </header>
  );
}

const today = () => new Date().toISOString().slice(0, 10);

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = "text",
  hint,
  autoComplete,
  inputMode,
  max,
  placeholder,
  optionalLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  hint?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "email" | "numeric";
  max?: string;
  placeholder?: string;
  optionalLabel?: string;
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required} optionalLabel={optionalLabel}>
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`field ${error ? "field-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        max={max}
        placeholder={placeholder}
      />
    </Field>
  );
}

function SelectField({
  id,
  label,
  value,
  onChange,
  error,
  required,
  options,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  hint?: string;
}) {
  return (
    <Field id={id} label={label} error={error} hint={hint} required={required}>
      <select
        id={id}
        name={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`field ${error ? "field-error" : ""}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

function RadioCards<T extends string>({
  legend,
  name,
  value,
  onChange,
  options,
  error,
  columns = 2,
  hint,
}: {
  legend: string;
  name: string;
  value: T | "";
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; description?: string; disabled?: boolean }>;
  error?: string;
  columns?: 1 | 2 | 3;
  hint?: string;
}) {
  const errorId = `${name}-error`;
  return (
    <fieldset aria-invalid={error ? true : undefined} aria-describedby={error ? errorId : undefined}>
      <legend className="label">{legend}</legend>
      {hint && <p className="mb-2 text-xs leading-relaxed text-muted">{hint}</p>}
      <div
        className={`grid gap-2 ${
          columns === 3 ? "sm:grid-cols-3" : columns === 2 ? "sm:grid-cols-2" : ""
        }`}
      >
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-2.5 border p-3 text-sm transition-colors ${
                checked
                  ? "border-forest-400 bg-forest-50/60"
                  : "border-line bg-paper hover:border-forest-300"
              } ${option.disabled ? "cursor-not-allowed opacity-50" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={option.disabled}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-forest-800"
              />
              <span>
                <span className="block font-medium text-ink">{option.label}</span>
                {option.description && (
                  <span className="mt-0.5 block text-xs leading-5 text-muted">{option.description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="err" role="alert">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </fieldset>
  );
}

/* ─────────────────────────── Step 1 ─────────────────────────── */

export function StepHousehold({ data, setData, errors, t }: StepProps) {
  const married = data.household.maritalStatus === "married";

  function setMarital(status: MaritalStatus) {
    setData((current) => ({
      ...current,
      household: {
        ...current.household,
        maritalStatus: status,
        spouseIncluded: status === "married",
        spouseExclusionReason: status === "married" ? current.household.spouseExclusionReason : "",
      },
    }));
  }

  return (
    <div className="space-y-7">
      <StepHeading index={1} title={t.apply.householdTitle} intro={t.apply.householdIntro} t={t} />

      <RadioCards
        legend={t.apply.maritalLabel}
        name="maritalStatus"
        value={data.household.maritalStatus}
        onChange={setMarital}
        error={errors["household.maritalStatus"]}
        options={[
          { value: "single", label: t.apply.maritalSingle },
          { value: "married", label: t.apply.maritalMarried },
          { value: "divorced", label: t.apply.maritalDivorced },
          { value: "widowed", label: t.apply.maritalWidowed },
          { value: "separated", label: t.apply.maritalSeparated },
        ]}
      />

      {married && (
        <div className="space-y-4 border border-line bg-paper p-4 sm:p-5">
          <RadioCards
            legend={t.apply.spouseIncludedLabel}
            name="spouseIncluded"
            value={data.household.spouseIncluded ? "yes" : "no"}
            onChange={(value) =>
              setData((current) => ({
                ...current,
                household: { ...current.household, spouseIncluded: value === "yes" },
              }))
            }
            hint={t.apply.spouseIncludedHelp}
            options={[
              { value: "yes", label: t.common.yes },
              { value: "no", label: t.common.no },
            ]}
          />

          {!data.household.spouseIncluded && (
            <div className="space-y-4 border-t border-line pt-4">
              <SelectField
                id="spouseExclusionPreset"
                label={t.apply.spouseExcludedLabel}
                value={
                  data.household.spouseExclusionReason.startsWith("US citizen")
                    ? "us"
                    : data.household.spouseExclusionReason.startsWith("Legal separation") ||
                        data.household.spouseExclusionReason.startsWith("Ndarje")
                      ? "sep"
                      : data.household.spouseExclusionReason
                        ? "other"
                        : ""
                }
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    household: {
                      ...current.household,
                      spouseExclusionReason:
                        value === "us"
                          ? "US citizen"
                          : value === "sep"
                            ? "Legal separation"
                            : value === "other"
                              ? "Other: "
                              : "",
                    },
                  }))
                }
                placeholder={t.common.none}
                options={[
                  { value: "us", label: t.apply.spouseExcludedUsCitizen },
                  { value: "sep", label: t.apply.spouseExcludedSeparated },
                  { value: "other", label: t.apply.spouseExcludedOther },
                ]}
              />
              <TextField
                id="spouseExclusionReason"
                label={t.apply.spouseExcludedExplain}
                value={data.household.spouseExclusionReason}
                onChange={(value) =>
                  setData((current) => ({
                    ...current,
                    household: { ...current.household, spouseExclusionReason: value },
                  }))
                }
                error={errors["household.spouseExclusionReason"]}
                required
              />
              <p className="flex items-start gap-2 border border-warning/40 bg-warning-50 p-3 text-xs leading-5 text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {t.apply.spouseExcludedWarning}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="border border-line bg-paper p-4 sm:p-5">
        <span className="label">{t.apply.childrenQuestion}</span>
        <p className="mb-3 text-xs leading-5 text-muted">{t.apply.childrenHelp}</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setData((current) => ({
                ...current,
                household: {
                  ...current.household,
                  declaredChildren: Math.max(0, current.household.declaredChildren - 1),
                },
              }))
            }
            className="flex h-11 w-11 items-center justify-center border border-line bg-paper text-ink hover:border-forest-300 disabled:opacity-40"
            disabled={data.household.declaredChildren <= 0}
            aria-label={t.apply.childRemove}
          >
            <Minus className="h-4 w-4" />
          </button>
          <output
            className="min-w-14 text-center text-2xl font-semibold tabular-nums text-ink"
            aria-live="polite"
          >
            {data.household.declaredChildren}
          </output>
          <button
            type="button"
            onClick={() =>
              setData((current) => ({
                ...current,
                household: {
                  ...current.household,
                  declaredChildren: Math.min(15, current.household.declaredChildren + 1),
                },
              }))
            }
            className="flex h-11 w-11 items-center justify-center border border-line bg-paper text-ink hover:border-forest-300 disabled:opacity-40"
            disabled={data.household.declaredChildren >= 15}
            aria-label={t.apply.childAdd}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {errors["household.declaredChildren"] && (
          <p className="err" role="alert">
            {errors["household.declaredChildren"]}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── Person fields (2 & 3) ─────────────────────── */

function PersonFields({
  person,
  prefix,
  errors,
  t,
  locale,
  setPerson,
  requireEducation,
}: {
  person: PersonData;
  prefix: string;
  errors: Record<string, string>;
  t: Copy;
  locale: Locale;
  setPerson: (patch: Partial<PersonData>) => void;
  requireEducation?: boolean;
}) {
  const countries = useMemo(() => countryOptions(locale), [locale]);

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <TextField
        id={`${prefix}.firstName`}
        label={t.apply.firstName}
        value={person.firstName}
        onChange={(value) => setPerson({ firstName: value })}
        error={errors[`${prefix}.firstName`]}
        required
        autoComplete="given-name"
      />
      <TextField
        id={`${prefix}.lastName`}
        label={t.apply.lastName}
        value={person.lastName}
        onChange={(value) => setPerson({ lastName: value })}
        error={errors[`${prefix}.lastName`]}
        required
        autoComplete="family-name"
      />
      <TextField
        id={`${prefix}.middleName`}
        label={t.apply.middleName}
        value={person.middleName}
        onChange={(value) => setPerson({ middleName: value })}
        optionalLabel={t.common.optional}
        autoComplete="additional-name"
      />
      <TextField
        id={`${prefix}.dateOfBirth`}
        label={t.apply.dob}
        value={person.dateOfBirth}
        onChange={(value) => setPerson({ dateOfBirth: value })}
        error={errors[`${prefix}.dateOfBirth`]}
        required
        type="date"
        max={today()}
        hint={prefix === "applicant" ? t.apply.whyDob : undefined}
      />

      <fieldset className="sm:col-span-2" aria-invalid={errors[`${prefix}.gender`] ? true : undefined}>
        <legend className="label">
          {t.apply.gender}
          <span className="ml-1 text-danger" aria-hidden="true">*</span>
        </legend>
        <div className="flex gap-2">
          {[
            { value: "male", label: t.apply.male },
            { value: "female", label: t.apply.female },
          ].map((option) => (
            <label
              key={option.value}
              className={`flex flex-1 cursor-pointer items-center gap-2 border p-3 text-sm ${
                person.gender === option.value
                  ? "border-forest bg-forest-50/60"
                  : "border-line bg-paper hover:border-forest-300"
              }`}
            >
              <input
                type="radio"
                name={`${prefix}.gender`}
                value={option.value}
                checked={person.gender === option.value}
                onChange={() => setPerson({ gender: option.value as "male" | "female" })}
                className="h-4 w-4 accent-forest-800"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors[`${prefix}.gender`] && (
          <p className="err" role="alert">
            {errors[`${prefix}.gender`]}
          </p>
        )}
      </fieldset>

      <TextField
        id={`${prefix}.birthCity`}
        label={t.apply.birthCity}
        value={person.birthCity}
        onChange={(value) => setPerson({ birthCity: value })}
        error={errors[`${prefix}.birthCity`]}
        required
      />
      <SelectField
        id={`${prefix}.birthCountry`}
        label={t.apply.birthCountry}
        value={person.birthCountry}
        onChange={(value) => setPerson({ birthCountry: value })}
        error={errors[`${prefix}.birthCountry`]}
        required
        options={countries}
        placeholder={t.common.none}
        hint={prefix === "applicant" ? t.apply.whyBirthPlace : undefined}
      />

      {prefix === "applicant" && (
        <SelectField
          id={`${prefix}.eligibilityCountry`}
          label={t.apply.eligibilityCountry}
          value={person.eligibilityCountry ?? ""}
          onChange={(value) => setPerson({ eligibilityCountry: value })}
          error={errors[`${prefix}.eligibilityCountry`]}
          options={countries}
          placeholder={t.apply.eligibilityCountrySame}
          hint={t.apply.eligibilityCountryHelp}
        />
      )}

      <SelectField
        id={`${prefix}.nationality`}
        label={t.apply.nationality}
        value={person.nationality ?? ""}
        onChange={(value) => setPerson({ nationality: value })}
        error={errors[`${prefix}.nationality`]}
        options={countries}
        placeholder={t.common.none}
      />

      {requireEducation && (
        <div className="sm:col-span-2">
          <SelectField
            id={`${prefix}.education`}
            label={t.apply.education}
            value={person.education ?? ""}
            onChange={(value) => setPerson({ education: value as PersonData["education"] })}
            error={errors[`${prefix}.education`]}
            required
            options={[
              { value: "none", label: t.apply.educationNone },
              { value: "high_school", label: t.apply.educationHighSchool },
              { value: "university", label: t.apply.educationUniversity },
              { value: "masters", label: t.apply.educationMasters },
              { value: "doctorate", label: t.apply.educationDoctorate },
            ]}
            placeholder={t.common.none}
            hint={t.apply.educationHelp}
          />
        </div>
      )}
    </div>
  );
}

export function StepApplicant({ data, setData, errors, t, locale }: StepProps) {
  return (
    <div className="space-y-7">
      <StepHeading index={2} title={t.apply.applicantTitle} intro={t.apply.applicantIntro} t={t} />
      <PersonFields
        person={data.applicant}
        prefix="applicant"
        errors={errors}
        t={t}
        locale={locale}
        setPerson={(patch) => setData((current) => ({ ...current, applicant: { ...current.applicant, ...patch } }))}
        requireEducation
      />
    </div>
  );
}

export function StepSpouse({ data, setData, errors, t, locale }: StepProps) {
  const married = data.household.maritalStatus === "married";
  const included = married && data.household.spouseIncluded;

  if (!included) {
    return (
      <div className="space-y-5">
        <StepHeading index={3} title={t.apply.spouseTitle} intro={t.apply.spouseNotApplicable} t={t} />
        <div className="border border-dashed border-line-strong bg-paper p-6">
          <p className="text-sm font-medium text-ink">{t.apply.spouseNotApplicable}</p>
          <p className="mt-1 text-[13px] leading-6 text-muted">
            {married ? t.apply.spouseExcludedBody : t.apply.spouseNotApplicableBody}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <StepHeading index={3} title={t.apply.spouseTitle} intro={t.apply.spouseIntro} t={t} />
      <PersonFields
        person={data.spouse}
        prefix="spouse"
        errors={errors}
        t={t}
        locale={locale}
        setPerson={(patch) => setData((current) => ({ ...current, spouse: { ...current.spouse, ...patch } }))}
      />
    </div>
  );
}

/* ─────────────────────────── Step 4 ─────────────────────────── */

export function StepChildren({ data, setData, errors, t, locale }: StepProps) {
  function addChild() {
    const child: ChildData = {
      id: crypto.randomUUID(),
      firstName: "",
      middleName: "",
      lastName: data.applicant.lastName,
      dateOfBirth: "",
      gender: "",
      birthCity: "",
      birthCountry: data.applicant.birthCountry,
      married: false,
      livesWithApplicant: true,
      isStepchild: false,
    };
    setData((current) => ({ ...current, children: [...current.children, child] }));
  }

  function updateChild(id: string, patch: Partial<ChildData>) {
    setData((current) => ({
      ...current,
      children: current.children.map((child) => (child.id === id ? { ...child, ...patch } : child)),
    }));
  }

  function removeChild(id: string) {
    setData((current) => ({ ...current, children: current.children.filter((child) => child.id !== id) }));
  }

  const countries = useMemo(() => countryOptions(locale), [locale]);

  return (
    <div className="space-y-6">
      <StepHeading index={4} title={t.apply.childrenTitle} intro={t.apply.childrenIntro} t={t} />

      <p className="border border-line bg-forest-50/50 p-3 text-xs leading-5 text-forest-800">
        {t.apply.childEligibilityNote}
      </p>

      {errors["children.count"] && (
        <p className="err" role="alert">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {errors["children.count"]}
        </p>
      )}

      {data.children.length === 0 && (
        <div className="border border-dashed border-line bg-paper p-8 text-center">
          <p className="text-sm text-muted">
            {t.apply.childrenDeclared}: {data.household.declaredChildren}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {data.children.map((child, index) => (
          <div key={child.id} className="border border-line bg-paper p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink">
                {t.apply.child} {index + 1}
              </h3>
              <button
                type="button"
                onClick={() => removeChild(child.id)}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-danger hover:bg-danger-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                {t.common.remove}
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id={`child-${index}-firstName`}
                label={t.apply.firstName}
                value={child.firstName}
                onChange={(value) => updateChild(child.id, { firstName: value })}
                error={errors[`children.${index}.firstName`]}
                required
              />
              <TextField
                id={`child-${index}-lastName`}
                label={t.apply.lastName}
                value={child.lastName}
                onChange={(value) => updateChild(child.id, { lastName: value })}
                error={errors[`children.${index}.lastName`]}
                required
              />
              <TextField
                id={`child-${index}-dob`}
                label={t.apply.dob}
                value={child.dateOfBirth}
                onChange={(value) => updateChild(child.id, { dateOfBirth: value })}
                error={errors[`children.${index}.dateOfBirth`]}
                required
                type="date"
                max={today()}
              />
              <div>
                <span className="label">{t.apply.gender}</span>
                <div className="flex gap-2">
                  {[
                    { value: "male", label: t.apply.male },
                    { value: "female", label: t.apply.female },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className={`flex flex-1 cursor-pointer items-center gap-2 border p-2.5 text-sm ${
                        child.gender === option.value
                          ? "border-forest bg-forest-50/60"
                          : "border-line bg-paper"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`child-${index}-gender`}
                        checked={child.gender === option.value}
                        onChange={() => updateChild(child.id, { gender: option.value as "male" | "female" })}
                        className="h-4 w-4 accent-forest-800"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {errors[`children.${index}.gender`] && (
                  <p className="err" role="alert">
                    {errors[`children.${index}.gender`]}
                  </p>
                )}
              </div>
              <TextField
                id={`child-${index}-birthCity`}
                label={t.apply.birthCity}
                value={child.birthCity}
                onChange={(value) => updateChild(child.id, { birthCity: value })}
                error={errors[`children.${index}.birthCity`]}
                required
              />
              <SelectField
                id={`child-${index}-birthCountry`}
                label={t.apply.birthCountry}
                value={child.birthCountry}
                onChange={(value) => updateChild(child.id, { birthCountry: value })}
                error={errors[`children.${index}.birthCountry`]}
                required
                options={countries}
                placeholder={t.common.none}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4">
              {[
                { key: "married" as const, label: t.apply.childMarried },
                { key: "livesWithApplicant" as const, label: t.apply.childLivesWith },
                { key: "isStepchild" as const, label: t.apply.childStepchild },
              ].map((option) => (
                <label key={option.key} className="flex cursor-pointer items-center gap-2 text-[13px] text-ink">
                  <input
                    type="checkbox"
                    checked={child[option.key]}
                    onChange={(event) => updateChild(child.id, { [option.key]: event.target.checked })}
                    className="h-4 w-4 rounded border-line accent-forest-800"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button type="button" onClick={addChild} className="btn-secondary">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {t.apply.childAdd}
      </button>
    </div>
  );
}

/* ─────────────────────────── Step 5 ─────────────────────────── */

export function StepContact({ data, setData, errors, t, locale }: StepProps) {
  const countries = useMemo(() => countryOptions(locale), [locale]);
  return (
    <div className="space-y-7">
      <StepHeading index={5} title={t.apply.contactTitle} intro={t.apply.contactIntro} t={t} />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="contact.email"
          label={t.common.email}
          value={data.contact.email}
          onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, email: value } }))}
          error={errors["contact.email"]}
          required
          type="email"
          inputMode="email"
          autoComplete="email"
          hint={t.apply.emailHelp}
        />
        <TextField
          id="contact.phone"
          label={t.common.phone}
          value={data.contact.phone}
          onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, phone: value } }))}
          error={errors["contact.phone"]}
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
        />
        <div className="sm:col-span-2">
          <TextField
            id="contact.addressLine1"
            label={t.apply.address1}
            value={data.contact.addressLine1}
            onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, addressLine1: value } }))}
            error={errors["contact.addressLine1"]}
            required
            autoComplete="address-line1"
          />
        </div>
        <div className="sm:col-span-2">
          <TextField
            id="contact.addressLine2"
            label={t.apply.address2}
            value={data.contact.addressLine2}
            onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, addressLine2: value } }))}
            optionalLabel={t.common.optional}
            autoComplete="address-line2"
          />
        </div>
        <TextField
          id="contact.city"
          label={t.apply.city}
          value={data.contact.city}
          onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, city: value } }))}
          error={errors["contact.city"]}
          required
          autoComplete="address-level2"
        />
        <TextField
          id="contact.postalCode"
          label={t.apply.postalCode}
          value={data.contact.postalCode}
          onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, postalCode: value } }))}
          optionalLabel={t.common.optional}
          autoComplete="postal-code"
          inputMode="numeric"
        />
        <SelectField
          id="contact.country"
          label={t.apply.country}
          value={data.contact.country}
          onChange={(value) => setData((current) => ({ ...current, contact: { ...current.contact, country: value } }))}
          error={errors["contact.country"]}
          required
          options={countries}
          placeholder={t.common.none}
        />
        <SelectField
          id="contact.preferredLocale"
          label={t.apply.preferredLanguage}
          value={data.contact.preferredLocale}
          onChange={(value) =>
            setData((current) => ({
              ...current,
              contact: { ...current.contact, preferredLocale: value as "sq" | "en" },
            }))
          }
          options={[
            { value: "sq", label: "Shqip" },
            { value: "en", label: "English" },
          ]}
          placeholder={t.common.none}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────── Step 6 ─────────────────────────── */

export function StepPhotos(props: StepProps & { draftId: string; draftSecret: string }) {
  const { data, setData, errors, locale, t, demo, draftId, draftSecret } = props;

  const members = useMemo(() => {
    const list: Array<{ key: string; name: string }> = [
      {
        key: "applicant",
        name: `${data.applicant.firstName} ${data.applicant.lastName}`.trim() || t.apply.step2,
      },
    ];
    if (data.household.maritalStatus === "married" && data.household.spouseIncluded) {
      list.push({
        key: "spouse",
        name: `${data.spouse.firstName} ${data.spouse.lastName}`.trim() || t.apply.step3,
      });
    }
    for (const child of data.children) {
      list.push({
        key: `child:${child.id}`,
        name: `${child.firstName} ${child.lastName}`.trim() || t.apply.child,
      });
    }
    return list;
  }, [data, t]);

  return (
    <div className="space-y-6">
      <StepHeading index={6} title={t.apply.photosTitle} intro={t.apply.photosIntro} t={t} />

      <div className="border border-line bg-paper p-3.5 text-xs leading-5 text-muted">
        {t.apply.photoRequirements}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {members.map((member) => (
          <PhotoTile
            key={member.key}
            memberKey={member.key}
            memberName={member.name}
            photo={data.photos[member.key]}
            error={errors[`photo.${member.key}`]}
            t={t}
            locale={locale}
            demo={demo}
            draftId={draftId}
            draftSecret={draftSecret}
            onUploaded={(photo) =>
              setData((current) => ({ ...current, photos: { ...current.photos, [member.key]: photo } }))
            }
            onRemoved={() =>
              setData((current) => {
                const next = { ...current.photos };
                delete next[member.key];
                return { ...current, photos: next };
              })
            }
          />
        ))}
      </div>

      <p className="text-xs leading-5 text-muted">{t.apply.photoAdvisory}</p>
    </div>
  );
}

/* ─────────────────────────── Step 7 ─────────────────────────── */

function ReviewSection({
  title,
  onEdit,
  editLabel,
  children,
}: {
  title: string;
  onEdit: () => void;
  editLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-line bg-paper">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{title}</h3>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-forest-800 hover:text-clay-600 hover:underline">
          {editLabel}
        </button>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line/60 py-1.5 last:border-0">
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-ink">{empty ? "—" : value}</dd>
    </div>
  );
}

export function StepReview({
  data,
  setData,
  errors,
  t,
  locale,
  goTo,
}: StepProps & { goTo: (step: number) => void }) {
  const hasChildren = data.children.length > 0;
  const consents = [
    { key: "terms", label: t.apply.consentTerms },
    { key: "privacy", label: t.apply.consentPrivacy },
    { key: "immediatePerformance", label: t.apply.consentImmediate },
    { key: "accuracy", label: t.apply.consentAccuracy },
    { key: "independentService", label: t.apply.consentIndependent },
    ...(hasChildren ? [{ key: "guardian", label: t.apply.guardianConsent }] : []),
  ];

  return (
    <div className="space-y-5">
      <StepHeading index={7} title={t.apply.reviewTitle} intro={t.apply.reviewIntro} t={t} />

      <ReviewSection title={t.apply.reviewApplicant} onEdit={() => goTo(2)} editLabel={t.common.edit}>
        <dl>
          <Row label={t.apply.firstName} value={`${data.applicant.firstName} ${data.applicant.middleName} ${data.applicant.lastName}`.replace(/\s+/g, " ")} />
          <Row label={t.apply.dob} value={data.applicant.dateOfBirth ? formatDate(data.applicant.dateOfBirth, locale) : ""} />
          <Row label={t.apply.gender} value={data.applicant.gender === "male" ? t.apply.male : data.applicant.gender === "female" ? t.apply.female : ""} />
          <Row label={t.apply.birthCity} value={data.applicant.birthCity} />
          <Row label={t.apply.birthCountry} value={data.applicant.birthCountry ? countryName(data.applicant.birthCountry, locale) : ""} />
          <Row label={t.apply.eligibilityCountry} value={data.applicant.eligibilityCountry ? countryName(data.applicant.eligibilityCountry, locale) : ""} />
          <Row label={t.apply.nationality} value={data.applicant.nationality ? countryName(data.applicant.nationality, locale) : ""} />
          <Row label={t.apply.education} value={data.applicant.education ? t.apply[`education${data.applicant.education === "high_school" ? "HighSchool" : data.applicant.education === "none" ? "None" : data.applicant.education === "university" ? "University" : data.applicant.education === "masters" ? "Masters" : "Doctorate"}` as keyof Copy["apply"]] : ""} />
        </dl>
      </ReviewSection>

      <ReviewSection title={t.apply.reviewHousehold} onEdit={() => goTo(1)} editLabel={t.common.edit}>
        <dl>
          <Row label={t.apply.maritalLabel} value={t.apply[`marital${data.household.maritalStatus === "single" ? "Single" : data.household.maritalStatus === "married" ? "Married" : data.household.maritalStatus === "divorced" ? "Divorced" : data.household.maritalStatus === "widowed" ? "Widowed" : "Separated"}` as keyof Copy["apply"]]} />
          <Row label={t.apply.childrenDeclared} value={String(data.household.declaredChildren)} />
        </dl>
      </ReviewSection>

      <ReviewSection title={t.apply.reviewSpouse} onEdit={() => goTo(3)} editLabel={t.common.edit}>
        {data.household.spouseIncluded ? (
          <dl>
            <Row label={t.common.name} value={`${data.spouse.firstName} ${data.spouse.lastName}`} />
            <Row label={t.apply.dob} value={data.spouse.dateOfBirth ? formatDate(data.spouse.dateOfBirth, locale) : ""} />
            <Row label={t.apply.birthCity} value={data.spouse.birthCity} />
          </dl>
        ) : (
          <p className="text-[13px] text-muted">{t.apply.reviewNoSpouse}</p>
        )}
      </ReviewSection>

      <ReviewSection title={t.apply.reviewChildren} onEdit={() => goTo(4)} editLabel={t.common.edit}>
        {hasChildren ? (
          <ul className="space-y-2">
            {data.children.map((child) => (
              <li key={child.id} className="flex items-baseline justify-between gap-4 text-[13px]">
                <span className="font-medium text-ink">
                  {child.firstName} {child.lastName}
                </span>
                <span className="text-muted">{formatDate(child.dateOfBirth, locale)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-muted">{t.apply.reviewNoChildren}</p>
        )}
      </ReviewSection>

      <ReviewSection title={t.apply.reviewContact} onEdit={() => goTo(5)} editLabel={t.common.edit}>
        <dl>
          <Row label={t.common.email} value={data.contact.email} />
          <Row label={t.common.phone} value={data.contact.phone} />
          <Row label={t.apply.address1} value={`${data.contact.addressLine1}, ${data.contact.city}`} />
        </dl>
      </ReviewSection>

      <ReviewSection title={t.apply.reviewPhotos} onEdit={() => goTo(6)} editLabel={t.common.edit}>
        <ul className="space-y-1.5">
          {Object.entries(data.photos).map(([key, photo]) => (
            <li key={key} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="text-ink">{photo.memberName || key}</span>
              <span className={photo.status === "invalid" ? "text-danger" : "text-success"}>
                {photo.status === "invalid" ? t.apply.photoInvalid : t.apply.photoValid}
              </span>
            </li>
          ))}
          {Object.keys(data.photos).length === 0 && (
            <li className="text-[13px] text-danger">{t.apply.photoMissing}</li>
          )}
        </ul>
      </ReviewSection>

      <section className="border border-line bg-paper p-4">
        <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted">{t.apply.consentTitle}</h3>
        <div className="mt-3 space-y-3">
          {consents.map((consent) => (
            <label key={consent.key} className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-6 text-ink">
              <input
                type="checkbox"
                checked={Boolean(data.consents[consent.key])}
                onChange={(event) =>
                  setData((current) => ({
                    ...current,
                    consents: { ...current.consents, [consent.key]: event.target.checked },
                  }))
                }
                className="mt-1 h-4 w-4 shrink-0 accent-forest-800"
              />
              <span>{consent.label}</span>
            </label>
          ))}
        </div>
        {Object.keys(errors)
          .filter((key) => key.startsWith("consents."))
          .map((key) => (
            <p key={key} className="err" role="alert">
              {errors[key]}
            </p>
          ))}
      </section>
    </div>
  );
}

/* ─────────────────────────── Step 8 ─────────────────────────── */

export function StepPayment({
  data,
  setData,
  locale,
  errors,
  t,
  cardEnabled,
  tier,
  priceCents,
}: StepProps & { cardEnabled: boolean; tier: PackageKey | null; priceCents: number | null }) {
  return (
    <div className="space-y-6">
      <StepHeading index={8} title={t.apply.paymentTitle} intro={t.apply.paymentIntro} t={t} />

      <fieldset aria-invalid={errors["paymentMethod"] ? true : undefined}>
        <legend className="sr-only">{t.apply.paymentTitle}</legend>
        <div className="space-y-3">
          <label
            className={`flex cursor-pointer items-start gap-3 border p-4 ${
              data.paymentMethod === "cash" ? "border-forest-400 bg-forest-50/60" : "border-line bg-paper"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="cash"
              checked={data.paymentMethod === "cash"}
              onChange={() => setData((current) => ({ ...current, paymentMethod: "cash" }))}
              className="mt-1 h-4 w-4 accent-forest-800"
            />
            <span>
              <span className="flex flex-wrap items-center gap-2 font-medium text-ink">
                {t.apply.paymentCash}
                <span className="chip border-forest-200 bg-paper text-forest-700">{t.apply.paymentDefault}</span>
              </span>
              <span className="mt-1 block text-[13px] leading-6 text-muted">{t.apply.paymentCashDesc}</span>
            </span>
          </label>

          <label
            className={`flex items-start gap-3 border p-4 ${
              !cardEnabled
                ? "cursor-not-allowed border-line bg-ivory/50 opacity-70"
                : data.paymentMethod === "card"
                  ? "cursor-pointer border-forest-400 bg-forest-50/60"
                  : "cursor-pointer border-line bg-paper"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={data.paymentMethod === "card"}
              disabled={!cardEnabled}
              onChange={() => setData((current) => ({ ...current, paymentMethod: "card" }))}
              className="mt-1 h-4 w-4 accent-forest-800"
            />
            <span>
              <span className="font-medium text-ink">{t.apply.paymentCard}</span>
              <span className="mt-1 block text-[13px] leading-6 text-muted">
                {cardEnabled ? t.apply.paymentCardDesc : t.apply.paymentCardDisabled}
              </span>
            </span>
          </label>
        </div>
        {errors["paymentMethod"] && (
          <p className="err" role="alert">
            {errors["paymentMethod"]}
          </p>
        )}
      </fieldset>

      <div className="border border-line bg-paper p-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted">
            {tier ? t.common[`pkg${tier === "individual" ? "Individual" : tier === "couple" ? "Couple" : "Family"}` as keyof Copy["common"]] : ""}
          </span>
          <span className="font-serif text-2xl text-forest-900">
            {priceCents !== null ? formatCurrency(priceCents, locale) : "-"}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">{t.apply.paymentFrozen}</p>
      </div>

      <p className="text-xs leading-5 text-muted">{t.apply.submitConsentNote}</p>
    </div>
  );
}
