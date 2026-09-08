import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

const dashboard = read("../app/admin/page.tsx");
const galleryList = read("../app/admin/galleries/page.tsx");
const galleryCreate = read("../app/admin/galleries/new/page.tsx");
const galleryWorkspace = read("../app/admin/galleries/[id]/page.tsx");
const galleryViewer = read("../app/gallery/[slug]/ClientGalleryViewer.tsx");
const styles = read("../app/globals.css");

test("admin dashboard exposes private galleries through the existing RLS-safe count path", () => {
  assert.match(dashboard, /title="Private client galleries"/);
  assert.match(dashboard, /href="\/admin\/galleries"/);
  assert.match(dashboard, /getCount\("client_galleries", session\.accessToken/);
  assert.doesNotMatch(dashboard, /service_role|sb_secret_/i);
});

test("gallery admin routes share the styled manager shell", () => {
  for (const source of [galleryList, galleryCreate, galleryWorkspace]) {
    assert.match(source, /GalleryAdminNav/);
    assert.match(source, /galleryAdminPage/);
  }

  for (const selector of [
    ".galleryAdminPage",
    ".galleryAdminNav",
    ".galleryManagerGrid",
    ".galleryWorkflow",
    ".adminFormGroup",
    ".adminUploadBox",
  ]) {
    assert.ok(styles.includes(selector), `missing gallery UI selector ${selector}`);
  }
});

test("gallery manager presents useful RLS-scoped operational counts", () => {
  assert.match(galleryList, /client_gallery_images\?select=id,gallery_id/);
  assert.match(galleryList, /client_gallery_selections\?select=gallery_id,image_id/);
  assert.match(galleryList, /Authorization: `Bearer \$\{accessToken\}`/);
  assert.match(galleryList, /selectionCounts/);
});

test("creation and workspace pages retain the secured gallery workflow", () => {
  assert.match(galleryCreate, /action="\/api\/admin\/galleries"/);
  assert.match(galleryCreate, /name="pin"/);
  assert.match(galleryCreate, /name="selection_limit"/);
  assert.match(galleryCreate, /name="expires_at"/);

  for (const stage of ["Draft", "Upload images", "Activate", "Client selection", "Finalized", "Review / reopen", "Archive"]) {
    assert.ok(galleryWorkspace.includes(stage), `missing workflow stage ${stage}`);
  }
  assert.match(galleryWorkspace, /GalleryImageUploader/);
  assert.match(galleryWorkspace, /\/api\/admin\/galleries\/\$\{gallery\.id\}\/status/);
});

test("client gallery remains photography-first and uses only protected image delivery", () => {
  assert.match(galleryViewer, /\/gallery\/\$\{encodeURIComponent\(props\.slug\)\}\/images\/\$\{encodeURIComponent\(image\.id\)\}/);
  assert.match(galleryViewer, /<progress/);
  assert.match(galleryViewer, /clientGalleryFinalizedNote/);
  assert.match(galleryViewer, /\/gallery\/\$\{encodeURIComponent\(props\.slug\)\}\/logout/);
  assert.doesNotMatch(galleryViewer, /storage_path|createSignedUrl|signedUrl/i);
});
