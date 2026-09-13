import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { authClient } from "@/lib/auth-client";
import { GuestProvider } from "./GuestProvider";
import { ToastProvider } from "./ToastProvider";
import { NetworkProvider } from "./NetworkProvider";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  throw new Error("EXPO_PUBLIC_CONVEX_URL is not set — check .env.local or eas.json");
}
const convex = new ConvexReactClient(convexUrl);

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexBetterAuthProvider client={convex} authClient={authClient}>
        <GuestProvider>
          <NetworkProvider>
            <ToastProvider>{children}</ToastProvider>
          </NetworkProvider>
        </GuestProvider>
      </ConvexBetterAuthProvider>
    </GestureHandlerRootView>
  );
}
