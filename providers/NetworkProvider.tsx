import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface NetworkContextType {
  isConnected: boolean;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: true });

export function useNetwork() {
  return useContext(NetworkContext);
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const connected = state.isConnected ?? true;
      setIsConnected(connected);
      if (connected) setDismissed(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
      {!isConnected && !dismissed && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            position: "absolute",
            top: 50,
            left: 16,
            right: 16,
            backgroundColor: "rgba(239, 68, 68, 0.95)",
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 9999,
          }}
        >
          <Text
            style={{
              fontFamily: "Montserrat_500Medium",
              fontSize: 13,
              color: "#fff",
              flex: 1,
            }}
          >
            No internet connection
          </Text>
          <Pressable onPress={() => setDismissed(true)}>
            <Text
              style={{
                fontFamily: "Montserrat_600SemiBold",
                fontSize: 12,
                color: "#fff",
                paddingLeft: 12,
              }}
            >
              Dismiss
            </Text>
          </Pressable>
        </Animated.View>
      )}
    </NetworkContext.Provider>
  );
}
