import type { PhotoIssue, PhotoRecord } from "@/lib/types";

/**
 * Draft data is written by the browser, so a photo record can arrive without
 * the optional metadata the upload route normally attaches (for example when a
 * client saves a trimmed object, or when an older draft is restored). Reading
 * `photo.issues` directly used to throw inside the staff case file, so every
 * consumer goes through this accessor instead.
 */
export function photoIssues(photo: PhotoRecord | null | undefined): PhotoIssue[] {
  return Array.isArray(photo?.issues) ? photo.issues : [];
}
