import { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "./useCurrentUser";
import { getEffectiveRole, type EffectiveRole, type User } from "@/lib/types";

// Module-level dev override — persists across re-renders, resets on app restart
let _devRoleOverride: EffectiveRole | null = null;
const _listeners = new Set<() => void>();

function setDevRoleOverride(role: EffectiveRole | null) {
  _devRoleOverride = role;
  _listeners.forEach((fn) => fn());
}

export function useUserRole() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const [devOverride, setDevOverride] = useState<EffectiveRole | null>(_devRoleOverride);

  useEffect(() => {
    const listener = () => setDevOverride(_devRoleOverride);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  const realRole: EffectiveRole = user
    ? getEffectiveRole(user)
    : "customer";

  const effectiveRole = devOverride ?? realRole;

  const setDevRole = useCallback((role: EffectiveRole | null) => {
    setDevRoleOverride(role);
  }, []);

  return {
    currentUser: user,
    effectiveRole,
    isLoading,
    isAuthenticated,
    // Dev-only
    devOverride,
    setDevRole,
  };
}
