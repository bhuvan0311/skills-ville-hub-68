import { describe, expect, it } from "vitest";
import { studentPhotoPath } from "./studentPhotos";
const path =
  "10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.jpg";
const project = "https://example.supabase.co";
describe("private student photo paths", () => {
  it("keeps object paths and resolves historical URLs only from the same project", () => {
    expect(studentPhotoPath(path, project)).toBe(path);
    expect(
      studentPhotoPath(
        `${project}/storage/v1/object/public/student-photos/${path}`,
        project,
      ),
    ).toBe(path);
  });
  it("rejects external URLs, signed tokens, other buckets and malformed paths", () => {
    for (const value of [
      "https://attacker.example/photo.jpg",
      `${project}/storage/v1/object/public/other/${path}`,
      `${project}/storage/v1/object/sign/student-photos/${path}?token=secret`,
      "../../other.jpg",
      "invalid.jpg",
    ])
      expect(studentPhotoPath(value, project)).toBeNull();
  });
});
