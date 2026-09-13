import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_KEY = "isGuestMode";

interface GuestContextValue {
  isGuest: boolean;
  isGuestLoading: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
}

const GuestContext = createContext<GuestContextValue>({
  isGuest: false,
  isGuestLoading: true,
  enterGuestMode: () => {},
  exitGuestMode: () => {},
});

export function GuestProvider({ children }: { children: ReactNode }) {
  const [isGuest, setIsGuest] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  // Guest mode is session-scoped — never restored from storage on app start.
  // AsyncStorage is only used so exitGuestMode can clear it during the session.
  useEffect(() => {
    AsyncStorage.removeItem(GUEST_KEY);
  }, []);

  const enterGuestMode = useCallback(() => {
    setIsGuest(true);
    AsyncStorage.setItem(GUEST_KEY, "true");
  }, []);

  const exitGuestMode = useCallback(() => {
    setIsGuest(false);
    AsyncStorage.removeItem(GUEST_KEY);
  }, []);

  return (
    <GuestContext.Provider value={{ isGuest, isGuestLoading, enterGuestMode, exitGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
}

export function useGuest() {
  return useContext(GuestContext);
}
