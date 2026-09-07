import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PIN_KEY_LENGTH = 32;

export function normalizeGalleryPin(pin: string) {
  return pin.trim();
}

export function hashGalleryPin(pin: string) {
  const normalized = normalizeGalleryPin(pin);
  if (normalized.length < 4 || normalized.length > 32) {
    throw new Error("Gallery PIN must be between 4 and 32 characters.");
  }

  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(normalized, salt, PIN_KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

export function verifyGalleryPin(pin: string, encoded: string) {
  const [scheme, salt, expectedHex] = encoded.split("$");
  if (scheme !== "scrypt" || !salt || !expectedHex) return false;

  try {
    const expected = Buffer.from(expectedHex, "hex");
    const actual = scryptSync(normalizeGalleryPin(pin), salt, expected.length);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

export function generateGallerySessionToken() {
  return randomBytes(32).toString("base64url");
}

export function digestGallerySessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function digestGalleryClient(slug: string, clientAddress: string) {
  return createHash("sha256")
    .update(`vault-gallery\0${slug}\0${clientAddress}`)
    .digest("hex");
}
