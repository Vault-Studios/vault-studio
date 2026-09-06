/**
 * Read a useful API error without assuming that an upstream or platform error
 * returned JSON. The fallback deliberately includes the HTTP status at the
 * call site so server failures remain diagnosable without exposing response
 * bodies that were not explicitly shaped as `{ error: string }`.
 *
 * @param {{ text(): Promise<string> }} response
 * @param {string} fallback
 */
export async function readApiError(response, fallback) {
  let text = "";

  try {
    text = await response.text();
  } catch {
    return fallback;
  }

  if (!text.trim()) return fallback;

  try {
    const payload = JSON.parse(text);
    return typeof payload?.error === "string" && payload.error.trim()
      ? payload.error.trim()
      : fallback;
  } catch {
    return fallback;
  }
}
