import { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { Sentry } from "@/lib/sentry";
import type { User } from "@/lib/types";

export function useCurrentUser(): {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
} {
  const { data: session, isPending } = authClient.useSession();
  // Only query Convex for user data when we have an active session.
  // Without this, Convex may return a cached user even after sign-out.
  const viewer = useQuery(api.users.viewer, session ? undefined : "skip");
  const user = (viewer as User | null | undefined) ?? null;

  // Keep Sentry user context in sync so future crash reports can be filtered by user.
  useEffect(() => {
    if (user) {
      Sentry.setUser({ id: user._id, email: user.email });
    } else if (!session) {
      Sentry.setUser(null);
    }
  }, [user, session]);

  return {
    user,
    isLoading: isPending || (!!session && viewer === undefined),
    isAuthenticated: !!session,
  };
}
