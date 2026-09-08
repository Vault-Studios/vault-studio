import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  GALLERY_UPLOAD_CONCURRENCY,
  GALLERY_UPLOAD_MAX_BYTES,
  runGalleryUploadQueue,
  validateGalleryUpload,
} from "../lib/gallery-upload-queue.ts";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const uploader = read("../app/admin/galleries/[id]/GalleryImageUploader.tsx");
const signRoute = read("../app/api/admin/galleries/[id]/images/sign/route.ts");
const completeRoute = read("../app/api/admin/galleries/[id]/images/complete/route.ts");
const thumbnailRoute = read("../app/api/admin/galleries/[id]/images/[imageId]/thumbnail/route.ts");
const adminNav = read("../app/admin/galleries/GalleryAdminNav.tsx");

for (const size of [1, 5, 25, 100]) {
  test(`gallery queue processes ${size} files with bounded concurrency`, async () => {
    const items = Array.from({ length: size }, (_, index) => index);
    let active = 0;
    let peak = 0;
    const seen = [];
    const results = await runGalleryUploadQueue(items, async (item) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      seen.push(item);
      active -= 1;
    });
    assert.equal(results.filter((result) => result.status === "fulfilled").length, size);
    assert.equal(new Set(seen).size, size);
    assert.ok(peak <= GALLERY_UPLOAD_CONCURRENCY);
    assert.ok(peak <= size);
  });
}

test("partial failures can be retried without repeating successful files", async () => {
  const attempts = new Map();
  const first = await runGalleryUploadQueue([0, 1, 2, 3, 4], async (item) => {
    attempts.set(item, (attempts.get(item) ?? 0) + 1);
    if (item === 1 || item === 3) throw new Error("synthetic failure");
  });
  const failed = first.filter((result) => result.status === "rejected").map((result) => result.item);
  assert.deepEqual(failed, [1, 3]);
  await runGalleryUploadQueue(failed, async (item) => attempts.set(item, (attempts.get(item) ?? 0) + 1));
  assert.deepEqual([...attempts.entries()], [[0, 1], [1, 2], [2, 1], [3, 2], [4, 1]]);
});

test("gallery upload validation rejects unsupported, empty, and oversized files", () => {
  assert.equal(validateGalleryUpload({ name: "photo.jpg", size: 1024, type: "image/jpeg" }), null);
  assert.match(validateGalleryUpload({ name: "photo.gif", size: 1024, type: "image/gif" }), /Unsupported/);
  assert.match(validateGalleryUpload({ name: "empty.png", size: 0, type: "image/png" }), /empty/);
  assert.match(validateGalleryUpload({ name: "large.webp", size: GALLERY_UPLOAD_MAX_BYTES + 1, type: "image/webp" }), /15 MB/);
});

test("signed upload uses the absolute Supabase destination and multipart PUT contract", () => {
  assert.match(signRoute, /`\$\{url\}\/storage\/v1\$\{signed\.url/);
  assert.match(signRoute, /target\.hostname !== new URL\(url\)\.hostname/);
  assert.match(uploader, /new FormData\(\)/);
  assert.match(uploader, /append\("cacheControl", "3600"\)/);
  assert.match(uploader, /method: "PUT"/);
  assert.match(uploader, /headers: \{ "x-upsert": "false" \}/);
  assert.doesNotMatch(uploader + signRoute, /service_role|sb_secret_/i);
});

test("uploader supports multi-select, drag and drop, queue states, cancellation, and retries", () => {
  assert.match(uploader, /type="file" multiple/);
  assert.match(uploader, /onDragEnter=/);
  assert.match(uploader, /onDrop=/);
  for (const state of ["queued", "authorizing", "uploading", "registering", "complete", "failed"]) {
    assert.ok(uploader.includes(`${state}:`), `missing visible ${state} queue state`);
  }
  assert.match(uploader, /Retry failed/);
  assert.match(uploader, /cancelQueued/);
  assert.match(uploader, /router\.refresh\(\)/);
});

test("completion is idempotent and private thumbnails remain admin-authenticated", () => {
  assert.match(completeRoute, /storage_path=eq\.\$\{encodeURIComponent\(path\)\}/);
  assert.match(completeRoute, /alreadyRegistered: true/);
  assert.match(thumbnailRoute, /getAdminSession\(\)/);
  assert.match(thumbnailRoute, /gallery_id=eq\.\$\{encodeURIComponent\(id\)\}/);
  assert.match(thumbnailRoute, /transform: \{ width: 480, height: 360/);
  assert.doesNotMatch(thumbnailRoute, /gallery-server|service_role|sb_secret_/i);
});

test("gallery admin logo bypasses the Vinext image optimizer", () => {
  assert.doesNotMatch(adminNav, /from "next\/image"/);
  assert.match(adminNav, /<img src="\/vault-logo-light\.png"/);
});
