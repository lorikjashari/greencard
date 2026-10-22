import type { ApplicationStatus, PhotoIssue } from "@/lib/types";

export interface PhotoRuleConfig {
  minSize: number;
  maxSize: number;
  maxUploadBytes: number;
  recommendedBytes: number;
  version: string;
}

export const DEFAULT_PHOTO_RULES: PhotoRuleConfig = {
  minSize: 600,
  maxSize: 1200,
  maxUploadBytes: 5 * 1024 * 1024,
  recommendedBytes: 240 * 1024,
  version: process.env.DV_PHOTO_RULES_VERSION ?? "2027.1",
};

/**
 * Photos are frozen once the case reaches final review or filing. After that,
 * a replacement would no longer match the photos reviewed and filed.
 */
export function photoUploadLocked(status: ApplicationStatus): boolean {
  return [
    "ready_to_file",
    "filed",
    "confirmation_sent",
    "selected",
    "not_selected",
    "cancelled",
    "expired",
    "rejected",
  ].includes(status);
}

export function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  return null;
}

export function readPngSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) return null;
  const isPng = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (!isPng) return null;
  const type = buffer.subarray(12, 16).toString("ascii");
  if (type !== "IHDR") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export function readJpegSize(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;

  let offset = 2;
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    if (marker === 0xd9 || marker === 0xda) break;

    const length = buffer.readUInt16BE(offset + 2);
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;

    if (isSof) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

/**
 * Removes EXIF/GPS/XMP/IPTC/comment segments from a JPEG without re-encoding.
 * The image data itself is untouched.
 */
export function stripJpegMetadata(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer;

  const chunks: Buffer[] = [buffer.subarray(0, 2)];
  let offset = 2;

  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      chunks.push(buffer.subarray(offset));
      break;
    }

    const marker = buffer[offset + 1];

    if (marker === 0xda) {
      // Start of scan — copy the header and all entropy data verbatim.
      chunks.push(buffer.subarray(offset));
      break;
    }
    if (marker === 0xd9) {
      chunks.push(buffer.subarray(offset, offset + 2));
      break;
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(buffer.subarray(offset, offset + 2));
      offset += 2;
      continue;
    }
    if (offset + 4 > buffer.length) break;

    const length = buffer.readUInt16BE(offset + 2);
    if (length < 2) break;
    const end = Math.min(buffer.length, offset + 2 + length);

    // APP1..APP15 and COM carry metadata; APP0 (JFIF) is kept.
    const isMetadata = (marker >= 0xe1 && marker <= 0xef) || marker === 0xfe;
    if (!isMetadata) chunks.push(buffer.subarray(offset, end));

    offset = end;
  }

  return Buffer.concat(chunks);
}

export function validatePhoto(
  buffer: Buffer,
  declaredType: string,
  rules: PhotoRuleConfig = DEFAULT_PHOTO_RULES,
): { ok: boolean; contentType: "image/jpeg" | "image/png" | null; width: number; height: number; issues: PhotoIssue[] } {
  const issues: PhotoIssue[] = [];
  const detected = detectImageType(buffer);

  if (!detected) {
    issues.push({
      code: "file_type",
      messageSq: "Skedari nuk është JPEG ose PNG i vlefshëm.",
      messageEn: "The file is not a valid JPEG or PNG.",
      severity: "error",
    });
    return { ok: false, contentType: null, width: 0, height: 0, issues };
  }

  if (declaredType && declaredType !== detected) {
    issues.push({
      code: "mime_mismatch",
      messageSq: "Lloji i deklaruar i skedarit nuk përputhet me përmbajtjen.",
      messageEn: "The declared file type does not match the file content.",
      severity: "error",
    });
  }

  if (buffer.length > rules.maxUploadBytes) {
    issues.push({
      code: "file_size",
      messageSq: `Skedari është shumë i madh (max ${Math.round(rules.maxUploadBytes / 1024 / 1024)} MB).`,
      messageEn: `The file is too large (max ${Math.round(rules.maxUploadBytes / 1024 / 1024)} MB).`,
      severity: "error",
    });
  }

  const size = detected === "image/jpeg" ? readJpegSize(buffer) : readPngSize(buffer);

  if (!size) {
    issues.push({
      code: "unreadable",
      messageSq: "Nuk arritëm të lexojmë përmasat e fotografisë. Provo një skedar tjetër.",
      messageEn: "We could not read the image dimensions. Try another file.",
      severity: "error",
    });
    return { ok: false, contentType: detected, width: 0, height: 0, issues };
  }

  const { width, height } = size;

  if (width !== height) {
    issues.push({
      code: "not_square",
      messageSq: `Fotografia duhet të jetë katrore (kjo është ${width}×${height}).`,
      messageEn: `The photo must be square (this one is ${width}×${height}).`,
      severity: "error",
    });
  }

  if (Math.min(width, height) < rules.minSize || Math.max(width, height) > rules.maxSize) {
    issues.push({
      code: "dimensions",
      messageSq: `Përmasat duhet të jenë ${rules.minSize}×${rules.minSize} deri ${rules.maxSize}×${rules.maxSize} px.`,
      messageEn: `Dimensions must be ${rules.minSize}×${rules.minSize} to ${rules.maxSize}×${rules.maxSize} px.`,
      severity: "error",
    });
  }

  if (buffer.length > rules.recommendedBytes) {
    issues.push({
      code: "size_advisory",
      messageSq: `Skedari është mbi ${Math.round(rules.recommendedBytes / 1024)} KB. Rregullat e DV-së rekomandojnë një skedar më të vogël; stafi mund ta optimizojë.`,
      messageEn: `The file is above ${Math.round(rules.recommendedBytes / 1024)} KB. DV rules recommend a smaller file; staff may optimise it.`,
      severity: "warning",
    });
  }

  return {
    ok: !issues.some((issue) => issue.severity === "error"),
    contentType: detected,
    width,
    height,
    issues,
  };
}

export function photoStorageKey(scope: string, memberKey: string, contentType: string): string {
  const ext = contentType === "image/png" ? "png" : "jpg";
  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeMember = memberKey.replace(/[^a-zA-Z0-9_-]/g, "_");
  return `photos/${safeScope}/${safeMember}.${ext}`;
}
