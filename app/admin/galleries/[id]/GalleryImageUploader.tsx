"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GALLERY_UPLOAD_MAX_FILES,
  runGalleryUploadQueue,
  validateGalleryUpload,
} from "../../../../lib/gallery-upload-queue";

type UploadState = "queued" | "authorizing" | "uploading" | "registering" | "complete" | "failed" | "cancelled";
type UploadItem = {
  id: string;
  file: File;
  state: UploadState;
  error: string;
  retryable: boolean;
  previewUrl: string;
  path?: string;
  filename?: string;
  signedUrl?: string;
  uploaded?: boolean;
};
type SignedUpload = { path?: string; filename?: string; signedUrl?: string; error?: string };

const STATE_LABELS: Record<UploadState, string> = {
  queued: "Queued", authorizing: "Authorizing", uploading: "Uploading", registering: "Registering",
  complete: "Complete", failed: "Failed", cancelled: "Cancelled",
};

function storageFailure(status: number) {
  if (status === 400) return "Storage rejected the signed upload (HTTP 400). Retry authorization or check the file.";
  if (status === 401 || status === 403) return `Storage authorization expired or was rejected (HTTP ${status}). Retry the file.`;
  if (status === 413) return "Storage rejected the file as too large (HTTP 413).";
  if (status === 415) return "Storage rejected the file type (HTTP 415).";
  return `Private Storage upload failed (HTTP ${status}). Retry the file.`;
}

async function responseMessage(response: Response) {
  const body = await response.json().catch(() => null) as { message?: string; error?: string } | null;
  return String(body?.message ?? body?.error ?? "");
}

export default function GalleryImageUploader({ galleryId }: { galleryId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<UploadItem[]>([]);
  const [running, setRunning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const itemsRef = useRef<UploadItem[]>([]);
  const registrationChain = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => () => {
    itemsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  }, []);

  function replaceItems(next: UploadItem[]) {
    itemsRef.current = next;
    setItems(next);
  }

  function updateItem(id: string, patch: Partial<UploadItem>) {
    replaceItems(itemsRef.current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function currentItem(id: string) {
    return itemsRef.current.find((item) => item.id === id);
  }

  async function register(item: UploadItem) {
    if (!item.path || !item.filename) throw new Error("Upload metadata is incomplete. Reauthorize this file.");
    const complete = await fetch(`/api/admin/galleries/${galleryId}/images/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: item.path, filename: item.filename }),
    });
    const completed = await complete.json().catch(() => ({})) as { error?: string };
    if (!complete.ok) throw new Error(completed.error || `Image registration failed (HTTP ${complete.status}).`);
  }

  async function uploadOne(id: string) {
    let item = currentItem(id);
    if (!item || item.state === "cancelled") return;

    if (!item.uploaded) {
      if (!item.signedUrl || !item.path || !item.filename) {
        updateItem(id, { state: "authorizing", error: "" });
        const sign = await fetch(`/api/admin/galleries/${galleryId}/images/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: item.file.name, contentType: item.file.type, size: item.file.size }),
        });
        const signed = await sign.json().catch(() => ({})) as SignedUpload;
        if (!sign.ok || !signed.path || !signed.filename || !signed.signedUrl) {
          throw new Error(signed.error || `Upload authorization failed (HTTP ${sign.status}).`);
        }
        updateItem(id, { path: signed.path, filename: signed.filename, signedUrl: signed.signedUrl });
      }

      item = currentItem(id);
      if (!item?.signedUrl) throw new Error("Upload authorization did not return a destination.");
      updateItem(id, { state: "uploading" });
      const uploadBody = new FormData();
      uploadBody.append("cacheControl", "3600");
      uploadBody.append("", item.file, item.filename || item.file.name);

      let storageResponse: Response;
      try {
        storageResponse = await fetch(item.signedUrl, { method: "PUT", headers: { "x-upsert": "false" }, body: uploadBody });
      } catch {
        throw new Error("Storage could not be reached. Check the network or CORS configuration, then retry.");
      }
      if (!storageResponse.ok) {
        const message = await responseMessage(storageResponse);
        if (!(storageResponse.status === 400 && /already exists|resource exists/i.test(message))) {
          throw new Error(storageFailure(storageResponse.status));
        }
      }
      updateItem(id, { uploaded: true });
    }

    item = currentItem(id);
    if (!item) return;
    updateItem(id, { state: "registering" });
    const registration = registrationChain.current.catch(() => undefined).then(() => register(item!));
    registrationChain.current = registration.catch(() => undefined);
    await registration;
    updateItem(id, { state: "complete", error: "", retryable: false });
  }

  async function runBatch(batch: UploadItem[]) {
    if (!batch.length) return;
    setRunning(true);
    setNotice("");
    await runGalleryUploadQueue(batch, async (queued) => {
      if (currentItem(queued.id)?.state === "cancelled") return;
      try {
        await uploadOne(queued.id);
      } catch (error) {
        updateItem(queued.id, { state: "failed", error: error instanceof Error ? error.message : "Upload failed.", retryable: true });
      }
    });
    setRunning(false);
    router.refresh();
  }

  function addFiles(fileList: FileList | File[]) {
    if (running) return;
    const incoming = Array.from(fileList);
    const remaining = Math.max(0, GALLERY_UPLOAD_MAX_FILES - itemsRef.current.length);
    const accepted = incoming.slice(0, remaining);
    setNotice(incoming.length > remaining ? `Only ${GALLERY_UPLOAD_MAX_FILES} files can be queued at once. ${incoming.length - remaining} were not added.` : "");

    const known = new Set(itemsRef.current.map((item) => `${item.file.name}:${item.file.size}:${item.file.lastModified}`));
    const next: UploadItem[] = [];
    for (const file of accepted) {
      const fingerprint = `${file.name}:${file.size}:${file.lastModified}`;
      if (known.has(fingerprint)) continue;
      known.add(fingerprint);
      const error = validateGalleryUpload(file);
      next.push({ id: crypto.randomUUID(), file, state: error ? "failed" : "queued", error: error ?? "", retryable: !error, previewUrl: URL.createObjectURL(file) });
    }

    replaceItems([...itemsRef.current, ...next]);
    const uploadable = next.filter((item) => item.state === "queued");
    if (uploadable.length) void runBatch(uploadable);
    if (!next.length && incoming.length) setNotice("Those files are already in this upload queue.");
  }

  function retryFailed() {
    if (running) return;
    const failed = itemsRef.current.filter((item) => item.state === "failed" && item.retryable);
    failed.forEach((item) => updateItem(item.id, { state: "queued", error: "" }));
    void runBatch(failed);
  }

  function cancelQueued(id: string) {
    if (currentItem(id)?.state === "queued") updateItem(id, { state: "cancelled", error: "" });
  }

  const complete = items.filter((item) => item.state === "complete").length;
  const failed = items.filter((item) => item.state === "failed").length;
  const settled = items.filter((item) => ["complete", "failed", "cancelled"].includes(item.state)).length;
  const retryable = items.some((item) => item.state === "failed" && item.retryable);

  return (
    <section className="galleryBulkUpload" aria-labelledby="gallery-upload-title">
      <div
        className={`adminUploadBox${dragging ? " isDragging" : ""}`}
        onDragEnter={(event) => { event.preventDefault(); if (!running) setDragging(true); }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
        onDrop={(event) => { event.preventDefault(); setDragging(false); if (!running) addFiles(event.dataTransfer.files); }}
      >
        <label>
          <strong id="gallery-upload-title">{dragging ? "Drop photos to add them" : "Add photos"}</strong>
          <span>Drop photos here or choose files</span>
          <small>JPEG, PNG or WebP · maximum 15 MB each · up to {GALLERY_UPLOAD_MAX_FILES} per queue</small>
          <input disabled={running} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ""; }} />
        </label>
      </div>

      {notice ? <p className="galleryUploadNotice" role="status">{notice}</p> : null}
      {items.length ? (
        <div className="galleryUploadQueue">
          <header>
            <div><p className="eyebrow">Private upload queue</p><h3>{running ? `Uploading ${items.length} photos` : `${items.length} photo${items.length === 1 ? "" : "s"} processed`}</h3><p>{complete} / {items.length} complete{failed ? ` · ${failed} failed` : ""}</p></div>
            {retryable ? <button type="button" disabled={running} onClick={retryFailed}>Retry failed</button> : null}
          </header>
          <progress aria-label={`${settled} of ${items.length} uploads processed`} max={items.length} value={settled} />
          <div className="galleryUploadQueueList">
            {items.map((item) => (
              <article className={`galleryUploadQueueItem is-${item.state}`} key={item.id}>
                {/* Local previews avoid loading full-resolution private objects for the queue. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.previewUrl} alt="" />
                <div><strong>{item.file.name}</strong><span>{item.error || STATE_LABELS[item.state]}</span></div>
                <b>{STATE_LABELS[item.state]}</b>
                {item.state === "queued" ? <button type="button" onClick={() => cancelQueued(item.id)}>Cancel</button> : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
