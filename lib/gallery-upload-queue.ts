export const GALLERY_UPLOAD_CONCURRENCY = 4;
export const GALLERY_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
export const GALLERY_UPLOAD_MAX_FILES = 250;
export const GALLERY_UPLOAD_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type QueueResult<T> =
  | { item: T; status: "fulfilled" }
  | { item: T; status: "rejected"; reason: unknown };

export function validateGalleryUpload(file: Pick<File, "name" | "size" | "type">) {
  if (!GALLERY_UPLOAD_TYPES.has(file.type)) {
    return "Unsupported file. Use JPEG, PNG or WebP.";
  }
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "This file is empty.";
  }
  if (file.size > GALLERY_UPLOAD_MAX_BYTES) {
    return "File exceeds the 15 MB maximum.";
  }
  return null;
}

export async function runGalleryUploadQueue<T>(
  items: readonly T[],
  worker: (item: T, index: number) => Promise<void>,
  concurrency = GALLERY_UPLOAD_CONCURRENCY
): Promise<QueueResult<T>[]> {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 8) {
    throw new RangeError("Upload concurrency must be between 1 and 8.");
  }

  const results = new Array<QueueResult<T>>(items.length);
  let cursor = 0;

  async function consume() {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      try {
        await worker(item, index);
        results[index] = { item, status: "fulfilled" };
      } catch (reason) {
        results[index] = { item, status: "rejected", reason };
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => consume()
  );
  await Promise.all(workers);
  return results;
}
