const photoPathPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$/i;

// Stored values are object paths. Convert historical URLs only from this project's bucket.
export function studentPhotoPath(
  value: string | undefined,
  projectUrl: string,
): string | null {
  if (!value) return null;
  if (photoPathPattern.test(value)) return value;
  try {
    const url = new URL(value);
    const prefix = "/storage/v1/object/public/student-photos/";
    if (
      url.origin !== new URL(projectUrl).origin ||
      !url.pathname.startsWith(prefix)
    )
      return null;
    const path = decodeURIComponent(url.pathname.slice(prefix.length));
    return photoPathPattern.test(path) ? path : null;
  } catch {
    return null;
  }
}
