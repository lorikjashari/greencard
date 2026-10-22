import { describe, expect, it } from "vitest";
import {
  DEFAULT_PHOTO_RULES,
  detectImageType,
  photoStorageKey,
  photoUploadLocked,
  readJpegSize,
  readPngSize,
  stripJpegMetadata,
  validatePhoto,
} from "./photo-rules";

function png(width: number, height: number): Buffer {
  const buffer = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write("IHDR", 12, "ascii");
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  buffer[24] = 8;
  buffer[25] = 2;
  return buffer;
}

function jpeg(width: number, height: number, extra?: Buffer): Buffer {
  const sof = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x00, 0x00, 0x00, 0x03, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01]);
  sof.writeUInt16BE(height, 5);
  sof.writeUInt16BE(width, 7);
  return Buffer.concat([
    Buffer.from([0xff, 0xd8]),
    ...(extra ? [extra] : []),
    sof,
    Buffer.from([0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]),
  ]);
}

describe("image signature detection", () => {
  it("detects PNG from magic bytes", () => {
    expect(detectImageType(png(600, 600))).toBe("image/png");
  });

  it("detects JPEG from magic bytes", () => {
    expect(detectImageType(jpeg(600, 600))).toBe("image/jpeg");
  });

  it("rejects other files", () => {
    expect(detectImageType(Buffer.from("not an image"))).toBeNull();
  });
});

describe("dimensions", () => {
  it("reads PNG dimensions", () => {
    expect(readPngSize(png(600, 800))).toEqual({ width: 600, height: 800 });
  });

  it("reads JPEG dimensions", () => {
    expect(readJpegSize(jpeg(900, 600))).toEqual({ width: 900, height: 600 });
  });
});

describe("validatePhoto", () => {
  it("accepts a square 600px PNG", () => {
    const result = validatePhoto(png(600, 600), "image/png");
    expect(result.ok).toBe(true);
    expect(result.width).toBe(600);
    expect(result.issues).toEqual([]);
  });

  it("rejects a non-square image", () => {
    const result = validatePhoto(png(600, 700), "image/png");
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("not_square");
  });

  it("rejects an image below the minimum size", () => {
    const result = validatePhoto(png(300, 300), "image/png");
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("dimensions");
  });

  it("rejects an image above the maximum size", () => {
    const result = validatePhoto(png(1201, 1201), "image/png");
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("dimensions");
  });

  it("rejects a declared MIME type that does not match the file", () => {
    const result = validatePhoto(png(600, 600), "image/jpeg");
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("mime_mismatch");
  });

  it("rejects non-images", () => {
    const result = validatePhoto(Buffer.from("hello"), "image/png");
    expect(result.ok).toBe(false);
    expect(result.contentType).toBeNull();
  });

  it("warns above the recommended file size without failing a valid image", () => {
    const large = Buffer.concat([png(600, 600), Buffer.alloc(DEFAULT_PHOTO_RULES.recommendedBytes + 1)]);
    const result = validatePhoto(large, "image/png");
    expect(result.ok).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toContain("size_advisory");
  });
});

describe("metadata stripping", () => {
  it("removes APP1 and comment segments but keeps image data", () => {
    const app1 = Buffer.concat([
      Buffer.from([0xff, 0xe1, 0x00, 0x08]),
      Buffer.from("Exif\0\0", "binary"),
    ]);
    const comment = Buffer.concat([
      Buffer.from([0xff, 0xfe, 0x00, 0x06]),
      Buffer.from("GPS!", "ascii"),
    ]);
    const original = jpeg(600, 600, Buffer.concat([app1, comment]));
    const cleaned = stripJpegMetadata(original);

    expect(cleaned.subarray(0, 2).equals(Buffer.from([0xff, 0xd8]))).toBe(true);
    expect(cleaned.includes(Buffer.from("Exif"))).toBe(false);
    expect(cleaned.includes(Buffer.from("GPS!"))).toBe(false);
    expect(cleaned.includes(Buffer.from([0xff, 0xda]))).toBe(true);
    expect(readJpegSize(cleaned)).toEqual({ width: 600, height: 600 });
  });
});

describe("photo storage keys", () => {
  it("scopes keys to the draft/application id", () => {
    expect(photoStorageKey("draft-123", "applicant", "image/jpeg")).toBe("photos/draft-123/applicant.jpg");
    expect(photoStorageKey("draft-123", "child:abc", "image/png")).toBe("photos/draft-123/child_abc.png");
  });

  it("sanitises path traversal characters", () => {
    expect(photoStorageKey("x", "../../etc/passwd", "image/jpeg")).toBe("photos/x/______etc_passwd.jpg");
  });

  it("sanitises the scope as well", () => {
    expect(photoStorageKey("../../other", "applicant", "image/jpeg")).toBe("photos/______other/applicant.jpg");
  });
});

describe("photo replacement window", () => {
  it("allows replacement only before final review or filing", () => {
    expect(photoUploadLocked("draft")).toBe(false);
    expect(photoUploadLocked("submitted")).toBe(false);
    expect(photoUploadLocked("in_review")).toBe(false);
    expect(photoUploadLocked("needs_information")).toBe(false);
    expect(photoUploadLocked("ready_to_file")).toBe(true);
    expect(photoUploadLocked("filed")).toBe(true);
    expect(photoUploadLocked("confirmation_sent")).toBe(true);
    expect(photoUploadLocked("cancelled")).toBe(true);
  });
});
