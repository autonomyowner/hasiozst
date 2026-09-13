import { useState, useEffect, useCallback } from "react";

type ViewMode = "b2b" | "b2c";

// Module-level state — persists across re-renders, resets on app restart
let _viewMode: ViewMode = "b2b";
const _listeners = new Set<() => void>();

function setViewMode(mode: ViewMode) {
  _viewMode = mode;
  _listeners.forEach((fn) => fn());
}

export function useViewMode() {
  const [viewMode, setLocal] = useState<ViewMode>(_viewMode);

  useEffect(() => {
    const listener = () => setLocal(_viewMode);
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(_viewMode === "b2b" ? "b2c" : "b2b");
  }, []);

  return {
    viewMode,
    isB2CMode: viewMode === "b2c",
    toggleViewMode,
  };
}
