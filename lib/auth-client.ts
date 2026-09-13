import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";
import { BACKEND_ENABLED, BACKEND_DISABLED_MESSAGE, CONVEX_SITE_URL } from "./backend";

// React Native has no concept of "same-origin", so we must point the auth
// client at the Convex HTTP site URL where better-auth routes are registered.
const createRealAuthClient = () =>
  createAuthClient({
    baseURL: CONVEX_SITE_URL,
    plugins: [convexClient()],
  });

type AuthClient = ReturnType<typeof createRealAuthClient>;

/**
 * Stand-in used while no backend is configured.
 *
 * It reports "signed out" immediately (rather than hanging on `isPending`) and
 * returns better-auth's `{ error: { message } }` result shape from every action,
 * so the sign-in and sign-up screens render a normal inline error instead of
 * throwing. Guest mode still works, so the app stays fully navigable.
 */
function createOfflineAuthClient() {
  const disabled = async () => ({
    data: null,
    error: { message: BACKEND_DISABLED_MESSAGE },
  });

  return {
    useSession: () => ({ data: null, isPending: false, error: null, refetch: () => {} }),
    getSession: disabled,
    signIn: { email: disabled, social: disabled },
    signUp: { email: disabled },
    // Sign-out must resolve quietly — screens call it during guest entry and teardown.
    signOut: async () => ({ data: null, error: null }),
  };
}

export const authClient: AuthClient = BACKEND_ENABLED
  ? createRealAuthClient()
  : (createOfflineAuthClient() as unknown as AuthClient);

export const { signIn, signUp, signOut, useSession } = authClient;
