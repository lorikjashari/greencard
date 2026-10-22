"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, UploadCloud } from "lucide-react";

export function PortalPhotoUpload({
  applicationId,
  memberKey,
  memberName,
  locale,
}: {
  applicationId: string;
  memberKey: string;
  memberName: string;
  locale: "sq" | "en";
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function upload(file: File) {
    setError(null);

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError(locale === "sq" ? "Pranohen vetëm JPEG ose PNG." : "Only JPEG or PNG are accepted.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(locale === "sq" ? "Skedari është shumë i madh (max 5 MB)." : "File is too large (max 5 MB).");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("applicationId", applicationId);
    form.append("memberKey", memberKey);

    setProgress(1);
    const request = new XMLHttpRequest();
    request.open("POST", "/api/uploads");
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) setProgress(Math.max(1, Math.round((event.loaded / event.total) * 100)));
    });
    request.addEventListener("load", () => {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
      try {
        const payload = JSON.parse(request.responseText) as { ok?: boolean; error?: string };
        if (request.status >= 200 && request.status < 300 && payload.ok) {
          router.refresh();
        } else {
          setError(payload.error ?? (locale === "sq" ? "Ngarkimi dështoi." : "Upload failed."));
        }
      } catch {
        setError(locale === "sq" ? "Ngarkimi dështoi." : "Upload failed.");
      }
    });
    request.addEventListener("error", () => {
      setProgress(null);
      setError(locale === "sq" ? "Problem me lidhjen." : "Network problem.");
    });
    request.send(form);
  }

  return (
    <div className="mt-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        disabled={progress !== null}
        onClick={() => inputRef.current?.click()}
        className="btn-secondary btn-sm"
        aria-label={
          locale === "sq" ? `Zëvendëso foton për ${memberName}` : `Replace photo for ${memberName}`
        }
      >
        {progress !== null ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <UploadCloud className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {progress !== null
          ? `${locale === "sq" ? "Duke ngarkuar" : "Uploading"} ${progress}%`
          : locale === "sq"
            ? "Ngarko foto të re"
            : "Upload new photo"}
      </button>
      {error && (
        <p className="err" role="alert">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
