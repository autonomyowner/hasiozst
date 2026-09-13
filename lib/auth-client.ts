import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

// React Native has no concept of "same-origin", so we must point the auth
// client at the Convex HTTP site URL where better-auth routes are registered.
const convexSiteUrl = process.env.EXPO_PUBLIC_CONVEX_SITE_URL;
if (!convexSiteUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_SITE_URL is not set — check .env.local or eas.json");
}

export const authClient = createAuthClient({
  baseURL: convexSiteUrl,
  plugins: [convexClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
