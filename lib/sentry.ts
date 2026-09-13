import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

// Build a release identifier that matches Sentry's expected format for Android.
// Format: `<package>@<version>+<versionCode>` — this is what `versionCode` gets stamped as.
const expoConfig = Constants.expoConfig;
const appVersion = expoConfig?.version ?? "0.0.0";
const androidVersionCode = expoConfig?.android?.versionCode;
const iosBuildNumber = expoConfig?.ios?.buildNumber;
const buildNumber =
  androidVersionCode != null
    ? String(androidVersionCode)
    : iosBuildNumber != null
    ? String(iosBuildNumber)
    : "0";
const packageId =
  expoConfig?.android?.package ??
  expoConfig?.ios?.bundleIdentifier ??
  "com.hasio.app";

const releaseId = `${packageId}@${appVersion}+${buildNumber}`;

// Navigation integration is created at module load so we can register the
// container ref from the root layout once it's available.
export const reactNavigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: false,
});

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) console.log("[Sentry] No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    environment: __DEV__ ? "development" : "production",
    release: releaseId,
    dist: buildNumber,
    enableNative: true,
    attachStacktrace: true,
    sendDefaultPii: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.05,
    integrations: [reactNavigationIntegration],
    // Filter known noise:
    // - "Invalid URL" variants: whatwg-url polyfill throws these for undefined/null/empty
    // - "urlGuard" / "fetchGuard": our diagnostic guard in lib/fetchGuard.ts reports
    //   these for expo-router internals (getStateFromPath-forks.js:372 calls
    //   `new URL("", "https://phony.example")` on every cold start). Root cause is
    //   the whatwg-url-without-unicode polyfill not handling empty first arg with
    //   valid base. The guard's passthrough fixes the crash; no need to report.
    ignoreErrors: [
      /Invalid URL: undefined/i,
      /Invalid URL:\s*$/i,
      /Invalid URL:\s*null/i,
      /urlGuard:/i,
      /fetchGuard:/i,
      /UrlGuardError/i,
      /FetchGuardError/i,
    ],
    beforeSend(event) {
      // Defensive: never report from dev builds even if `enabled` flag is bypassed.
      if (__DEV__) return null;

      // Tag any remaining "Invalid URL" events so we can filter them in the dashboard.
      const message =
        event.message ??
        event.exception?.values?.[0]?.value ??
        "";
      if (typeof message === "string" && /Invalid URL/i.test(message)) {
        event.tags = {
          ...event.tags,
          possible_root_cause: "fetch_or_url_with_undefined",
        };
      }

      // Strip auth tokens from breadcrumb URLs to avoid leaking PII.
      // Guard: only process valid http(s) URLs to avoid triggering
      // fetchGuard's URL constructor guard on empty/malformed breadcrumb URLs
      // (which would cause recursive Sentry captures).
      if (event.breadcrumbs) {
        for (const crumb of event.breadcrumbs) {
          const data = crumb.data as { url?: unknown } | undefined;
          if (
            data &&
            typeof data.url === "string" &&
            data.url.length > 0 &&
            /^https?:\/\/.+/i.test(data.url)
          ) {
            try {
              const u = new URL(data.url);
              const sensitiveKeys = ["token", "access_token", "auth", "key", "secret"];
              for (const key of sensitiveKeys) {
                if (u.searchParams.has(key)) {
                  u.searchParams.set(key, "[Filtered]");
                }
              }
              data.url = u.toString();
            } catch {
              // URL was malformed; leave as-is.
            }
          }
        }
      }

      return event;
    },
  });
}

export { Sentry };
