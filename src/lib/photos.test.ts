import { describe, expect, it } from "vitest";
import { photoIssues } from "@/lib/photos";
import type { PhotoRecord } from "@/lib/types";

const base: PhotoRecord = {
  id: "photo-1",
  memberKey: "applicant",
  memberName: "Test Applicant",
  storageKey: "photos/draft/applicant.jpg",
  originalName: "photo.jpg",
  contentType: "image/jpeg",
  bytes: 4506,
  width: 600,
  height: 600,
  status: "valid",
  issues: [],
  rulesVersion: "2027.1",
  uploadedAt: "2026-10-29T00:00:00.000Z",
  previewUrl: "/api/files/photos/draft/applicant.jpg",
};

describe("photoIssues", () => {
  it("returns the recorded issues", () => {
    const issues = [{ code: "size_advisory" as const, severity: "warning" as const, messageSq: "a", messageEn: "b" }];
    expect(photoIssues({ ...base, issues })).toHaveLength(1);
  });

  it("tolerates records saved without an issues array", () => {
    const trimmed = { ...base } as Partial<PhotoRecord>;
    delete trimmed.issues;
    expect(photoIssues(trimmed as PhotoRecord)).toEqual([]);
  });

  it("tolerates a missing photo", () => {
    expect(photoIssues(null)).toEqual([]);
    expect(photoIssues(undefined)).toEqual([]);
  });
});
