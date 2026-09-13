/**
 * Strict http(s) URL validator.
 *
 * Returns true only for non-empty strings that look like real http(s) URLs.
 * Rejects: null, undefined, empty string, the literal strings "undefined" /
 * "null", and any input that doesn't start with `http://` or `https://`.
 *
 * Use this everywhere we feed a URL into expo-video, fetch, or new URL().
 */
export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  if (value === "undefined" || value === "null") return false;
  return /^https?:\/\/.+/i.test(value);
}
