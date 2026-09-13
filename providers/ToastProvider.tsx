import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Toast, ToastVariant } from "@/components/ui/Toast";

interface ToastState {
  message: string;
  variant: ToastVariant;
  visible: boolean;
}

interface ToastContextValue {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    variant: "info",
    visible: false,
  });

  const show = useCallback((message: string, variant: ToastVariant) => {
    setToast({ message, variant, visible: true });
  }, []);

  const dismiss = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider
      value={{
        showSuccess: (msg) => show(msg, "success"),
        showError: (msg) => show(msg, "error"),
        showInfo: (msg) => show(msg, "info"),
      }}
    >
      {children}
      <Toast
        message={toast.message}
        variant={toast.variant}
        visible={toast.visible}
        onDismiss={dismiss}
      />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
