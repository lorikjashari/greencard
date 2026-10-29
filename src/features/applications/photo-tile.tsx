"use client";

import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ImageIcon, Loader2, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import type { Copy } from "@/messages/get";
import type { Locale } from "@/lib/i18n";
import { photoIssues } from "@/lib/photos";
import type { PhotoRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

const MAX_BYTES = 5 * 1024 * 1024;

export function PhotoTile({
  memberKey,
  memberName,
  photo,
  error,
  t,
  locale,
  demo,
  draftId,
  draftSecret,
  onUploaded,
  onRemoved,
}: {
  memberKey: string;
  memberName: string;
  photo?: PhotoRecord;
  error?: string;
  t: Copy;
  locale: Locale;
  demo: boolean;
  draftId: string;
  draftSecret: string;
  onUploaded: (photo: PhotoRecord) => void;
  onRemoved: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  async function upload(file: File) {
    setLocalError(null);

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setLocalError(t.errors.fileType);
      return;
    }
    if (file.size > MAX_BYTES) {
      setLocalError(t.errors.fileSize);
      return;
    }

    if (!draftId || !draftSecret) {
      setLocalError(t.errors.uploadFailed);
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("draftId", draftId);
    form.append("memberKey", memberKey);

    setProgress(1);

    try {
      const photo = await new Promise<PhotoRecord>((resolve, reject) => {
        const request = new XMLHttpRequest();
        request.open("POST", "/api/uploads");
        request.setRequestHeader("x-draft-secret", draftSecret);
        request.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
          }
        });
        request.addEventListener("load", () => {
          try {
            const payload = JSON.parse(request.responseText) as
              | { ok: true; photo: PhotoRecord }
              | { ok: false; error: string };
            if (request.status >= 200 && request.status < 300 && payload.ok) {
              // The upload route always returns the full record; normalise it so
              // an older server build cannot break the review step downstream.
              resolve({ ...payload.photo, issues: payload.photo.issues ?? [] });
            } else {
              reject(new Error("error" in payload ? payload.error : t.errors.uploadFailed));
            }
          } catch {
            reject(new Error(t.errors.uploadFailed));
          }
        });
        request.addEventListener("error", () => reject(new Error(t.errors.network)));
        request.send(form);
      });

      onUploaded(photo);
      setProgress(null);
    } catch (uploadError) {
      setProgress(null);
      setLocalError((uploadError as Error).message || t.errors.uploadFailed);
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function generateDemoPhoto() {
    if (!demo) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 600;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#F2F1EA";
    context.fillRect(0, 0, 600, 600);
    context.strokeStyle = "#153D32";
    context.lineWidth = 3;
    context.strokeRect(18, 18, 564, 564);
    context.fillStyle = "#153D32";
    context.font = "600 64px Arial, sans-serif";
    context.textAlign = "center";
    const label = memberName.trim().slice(0, 22) || "DEMO";
    context.fillText(label, 300, 300);
    context.font = "500 22px Arial, sans-serif";
    context.fillStyle = "#68716B";
    context.fillText("DEMO PHOTO — NOT VALID FOR FILING", 300, 350);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `demo-${memberKey.replace(/[^a-z0-9]/gi, "-")}.jpg`, {
          type: "image/jpeg",
        });
        void upload(file);
      },
      "image/jpeg",
      0.9,
    );
  }

  const preview = photo?.previewUrl ?? (photo ? `/api/files/${photo.storageKey}` : null);
  const issues = photoIssues(photo).filter((issue) => issue.severity === "error");

  return (
    <div
      className={cn(
        "flex flex-col border bg-paper p-3.5",
        error ? "border-danger/50" : "border-line",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-ink">{memberName}</p>
          <p className="text-2xs text-muted">
            {t.apply.photoFor}: {memberKey === "applicant" ? t.apply.step2 : memberKey === "spouse" ? t.apply.step3 : t.apply.step4}
          </p>
        </div>
        {photo && (
          <span
            className={cn(
              "chip shrink-0",
              photo.status === "invalid" || photo.status === "rejected"
                ? "border-danger/40 bg-danger-50 text-danger"
                : "border-forest-300 bg-forest-50 text-forest-700",
            )}
          >
            {photo.status === "invalid" || photo.status === "rejected" ? (
              <AlertTriangle className="h-3 w-3" />
            ) : (
              <CheckCircle2 className="h-3 w-3" />
            )}
            {photo.status === "invalid" || photo.status === "rejected"
              ? t.apply.photoInvalid
              : t.apply.photoValid}
          </span>
        )}
      </div>

      <div className="relative mt-3 aspect-square w-full overflow-hidden border border-line bg-ivory">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={`${t.apply.photoFor} ${memberName}`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted">
            <ImageIcon className="h-7 w-7 opacity-30" aria-hidden="true" />
            <span className="font-mono text-3xs uppercase" style={{ letterSpacing: "0.1em" }}>{t.apply.photoMissing}</span>
          </div>
        )}

        {progress !== null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper/90">
            <Loader2 className="h-6 w-6 animate-spin text-forest-800" aria-hidden="true" />
            <span className="mt-2 text-xs font-medium text-forest-800">{progress}%</span>
          </div>
        )}
      </div>

      {photo && photo.status !== "invalid" && (
        <p className="mt-2 text-2xs text-muted">
          {photo.width}×{photo.height}px · {Math.round(photo.bytes / 1024)} KB
        </p>
      )}

      {issues.length > 0 && (
        <ul className="mt-2 space-y-1">
          {issues.map((issue) => (
            <li key={issue.code} className="flex items-start gap-1 text-2xs leading-4 text-danger">
              <AlertTriangle className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
              {locale === "sq" ? issue.messageSq : issue.messageEn}
            </li>
          ))}
        </ul>
      )}

      {(error || localError) && (
        <p className="err" role="alert">
          <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {localError ?? error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={progress !== null}
          className="btn-secondary btn-sm"
        >
          {photo ? <RefreshCw className="h-3.5 w-3.5" /> : <UploadCloud className="h-3.5 w-3.5" />}
          {photo ? t.apply.photoReplace : t.apply.photoChoose}
        </button>

        {photo && (
          <button
            type="button"
            onClick={onRemoved}
            disabled={progress !== null}
            className="inline-flex min-h-9 items-center gap-1 rounded-sm px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t.common.remove}
          </button>
        )}
      </div>

      {demo && (
        <div className="mt-3 border-t border-dashed border-line pt-2.5">
          <button
            type="button"
            onClick={generateDemoPhoto}
            disabled={progress !== null}
            className="font-mono text-3xs uppercase text-forest-700 underline decoration-forest-700/30 underline-offset-2 hover:text-clay-600"
          >
            {t.apply.photoDemoGenerate}
          </button>
          <p className="mt-1 text-2xs text-muted">{t.apply.photoDemoNote}</p>
        </div>
      )}
    </div>
  );
}
