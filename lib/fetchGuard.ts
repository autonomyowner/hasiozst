/**
 * Diagnostic global guards for `fetch()` and `new URL()`.
 *
 * Background: Sentry is reporting `TypeError: Invalid URL: undefined` from
 * deep inside `whatwg-url-without-unicode`. The minified Hermes stack traces
 * are useless. To pinpoint the real caller, this module monkey-patches
 * `global.fetch` and `global.URL` so that ANY invocation with `null` /
 * `undefined` / empty / non-http(s) input captures a *named* error with the
 * full call stack and rich Sentry context BEFORE the underlying URL parser
 * throws.
 *
 * Activation:
 *   import { installFetchGuard } from "@/lib/fetchGuard";
 *   installFetchGuard(); // call BEFORE Sentry.init()
 *
 * No-op in __DEV__ to avoid noise during development.
 *
 * Important: this guard is *intentionally temporary*. Once we identify the
 * real caller via the next Sentry event, the underlying bug should be fixed
 * and this module can be removed.
 */
import * as Sentry from "@sentry/react-native";

let installed = false;

function isInvalidFetchInput(input: unknown): boolean {
  if (input == null) return true;
  if (typeof input === "string") {
    if (input.length === 0) return true;
    // Reject literal "undefined" / "null" strings (corrupted seed data).
    if (input === "undefined" || input === "null") return true;
    // Allow http, https, ws, wss, file, data, blob — anything with a scheme.
    if (!/^[a-z][a-z0-9+\-.]*:/i.test(input)) return true;
    return false;
  }
  // URL instances and Request objects are valid.
  return false;
}

function captureGuardError(
  source: "fetch_guard" | "url_guard",
  message: string,
  input: unknown,
  init?: unknown
) {
  // Build a named Error so the stack trace points at the *caller*,
  // not at the underlying URL parser.
  const err = new Error(message);
  err.name = source === "fetch_guard" ? "FetchGuardError" : "UrlGuardError";

  try {
    Sentry.withScope((scope) => {
      scope.setTag("source", source);
      scope.setLevel("error");
      scope.setExtra(
        "input",
        typeof input === "string" ? input : Object.prototype.toString.call(input)
      );
      scope.setExtra("inputType", typeof input);
      if (init !== undefined) {
        scope.setExtra("init", init);
      }
      Sentry.captureException(err);
    });
  } catch {
    // Sentry not initialized yet — fall through.
  }

  // Also log to console so it's visible in `adb logcat`.
  // eslint-disable-next-line no-console
  console.error(`[${source}] ${message}`, { input, init });
}

export function installFetchGuard() {
  if (installed) return;
  installed = true;

  // No-op in development to avoid noise.
  if (__DEV__) return;

  const g = globalThis as unknown as {
    fetch: typeof fetch;
    URL: typeof URL;
  };

  // ─── fetch guard ─────────────────────────────────────────────────────────
  const originalFetch = g.fetch;
  if (typeof originalFetch === "function") {
    const wrappedFetch = function (
      this: unknown,
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      if (isInvalidFetchInput(input as unknown)) {
        captureGuardError(
          "fetch_guard",
          "fetchGuard: fetch called with invalid input",
          input,
          init
        );
        return Promise.reject(
          new TypeError(
            `fetchGuard: fetch called with invalid input (${typeof input}: ${String(input)})`
          )
        );
      }
      return originalFetch.call(this, input as RequestInfo, init);
    } as typeof fetch;
    // Preserve any properties hung off the original fetch.
    Object.setPrototypeOf(wrappedFetch, originalFetch);
    g.fetch = wrappedFetch;
  }

  // ─── URL constructor guard ───────────────────────────────────────────────
  const OriginalURL = g.URL;
  if (typeof OriginalURL === "function") {
    function GuardedURL(this: unknown, url?: unknown, base?: unknown) {
      const isEmptyInput =
        url == null || url === "" || url === "undefined" || url === "null";

      // Spec-compliant workaround for React Native's `whatwg-url-without-unicode`
      // polyfill bug: `new URL("", "https://example.com/")` should return the
      // base URL itself per WHATWG spec, but the polyfill throws.
      //
      // This bug is hit by `expo-router/build/fork/getStateFromPath-forks.js`
      // line 372 (`new URL(path, 'https://phony.example').searchParams`) on
      // every cold-start when the initial deep-link path is empty (e.g. when
      // the user opens the app with no notification or the URL is just the
      // bare host). It accounted for HASIO-1/2/3 — the misleading message
      // comes from the polyfill stringifying empty input.
      //
      // When the input is empty/null AND the base is a valid string URL with
      // a scheme, construct from the base alone — this matches browser
      // behaviour exactly.
      if (
        isEmptyInput &&
        typeof base === "string" &&
        /^[a-z][a-z0-9+\-.]*:/i.test(base)
      ) {
        try {
          return new (OriginalURL as unknown as new (u: string) => URL)(base);
        } catch {
          // Even base-only construction failed (broken polyfill). Log locally
          // but do NOT report to Sentry — this is a known third-party issue,
          // not our app code.
          // eslint-disable-next-line no-console
          console.warn(
            `[url_guard] polyfill cannot construct URL from base "${base}"`
          );
          throw new TypeError(
            `urlGuard: polyfill bug — new URL("${String(url)}", "${base}") failed`
          );
        }
      }

      if (isEmptyInput) {
        captureGuardError(
          "url_guard",
          "urlGuard: new URL called with invalid input",
          url,
          base
        );
        // Re-throw with a descriptive message; behaviour-compatible with
        // whatwg-url's TypeError so existing catch handlers still work.
        throw new TypeError(
          `urlGuard: new URL called with invalid input (${typeof url}: ${String(url)})`
        );
      }
      // Forward to the real constructor.
      return new (OriginalURL as unknown as new (
        u: unknown,
        b?: unknown
      ) => URL)(url, base);
    }
    // Preserve prototype chain so `instanceof URL` keeps working.
    GuardedURL.prototype = OriginalURL.prototype;
    Object.setPrototypeOf(GuardedURL, OriginalURL);
    // Copy static methods (createObjectURL / revokeObjectURL etc).
    for (const key of Object.getOwnPropertyNames(OriginalURL)) {
      if (key === "prototype" || key === "name" || key === "length") continue;
      try {
        (GuardedURL as unknown as Record<string, unknown>)[key] =
          (OriginalURL as unknown as Record<string, unknown>)[key];
      } catch {
        // Some properties may be non-writable; skip silently.
      }
    }
    g.URL = GuardedURL as unknown as typeof URL;
  }
}
