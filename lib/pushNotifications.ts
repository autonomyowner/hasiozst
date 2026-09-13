import Constants, { ExecutionEnvironment } from "expo-constants";

/**
 * Safe access to `expo-notifications`.
 *
 * Since SDK 53 the module **throws at import time** inside Expo Go on Android
 * (remote push was removed from Expo Go). A static `import * as Notifications`
 * therefore takes down whatever imports it — in our case `app/_layout.tsx`, which
 * then looks like "Route ./_layout.tsx is missing the required default export"
 * followed by a `Cannot read property 'ErrorBoundary' of undefined` crash.
 *
 * So the module is loaded lazily, only outside Expo Go, and every failure is
 * tolerated. Push is best-effort: the app must run fine without it.
 *
 * Use a development build (`npx expo run:android` or an EAS dev-client build) to
 * get real push notifications back.
 */
export const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/** False in Expo Go, where loading the native module would throw. */
export const PUSH_AVAILABLE = !IS_EXPO_GO;

type NotificationsModule = typeof import("expo-notifications");

let cached: NotificationsModule | null | undefined;

/** Returns the module, or `null` when push isn't usable in this runtime. */
export function getNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;

  if (!PUSH_AVAILABLE) {
    cached = null;
    return cached;
  }

  try {
    // Lazy on purpose — evaluating this in Expo Go throws. See above.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require("expo-notifications") as NotificationsModule;
  } catch {
    cached = null;
  }

  return cached;
}
