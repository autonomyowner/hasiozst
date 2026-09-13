import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { authClient } from "@/lib/auth-client";
import { BACKEND_ENABLED, CONVEX_URL, CONVEX_PLACEHOLDER_URL } from "@/lib/backend";
import { GuestProvider } from "./GuestProvider";
import { ToastProvider } from "./ToastProvider";
import { NetworkProvider } from "./NetworkProvider";

// A client is always constructed so `useQuery` has a provider to read from even
// with no backend configured — queries then just stay `undefined` forever, which
// screens already treat as their loading/empty state. See lib/backend.ts.
const convex = new ConvexReactClient(
  BACKEND_ENABLED ? CONVEX_URL : CONVEX_PLACEHOLDER_URL
);

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const content = (
    <GuestProvider>
      <NetworkProvider>
        <ToastProvider>{children}</ToastProvider>
      </NetworkProvider>
    </GuestProvider>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {BACKEND_ENABLED ? (
        <ConvexBetterAuthProvider client={convex} authClient={authClient}>
          {content}
        </ConvexBetterAuthProvider>
      ) : (
        // No auth provider without a backend — better-auth would poll a dead host.
        <ConvexProvider client={convex}>{content}</ConvexProvider>
      )}
    </GestureHandlerRootView>
  );
}
