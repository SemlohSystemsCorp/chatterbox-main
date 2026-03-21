"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  /** Whether the toast is currently visible (used for exit animation) */
  visible: boolean;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const dismissToast = useCallback((id: string) => {
    // Start exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
    );
    // Remove after animation completes
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
    // Clean up auto-dismiss timer
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, message, type, visible: true }]);

      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        dismissToast(id);
        timersRef.current.delete(id);
      }, 4000);
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  // Clean up all timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col-reverse gap-2">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onDismiss={() => dismissToast(toast.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

const typeStyles: Record<ToastType, string> = {
  success: "border-[#22c55e]/20",
  error: "border-[#de1135]/20",
  info: "border-[#1a1a1a]",
};

const dotStyles: Record<ToastType, string> = {
  success: "bg-[#22c55e]",
  error: "bg-[#de1135]",
  info: "bg-[#276ef1]",
};

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-[10px] border bg-[#111] px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-200 ${
        typeStyles[toast.type]
      } ${
        toast.visible
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0"
      }`}
      role="status"
    >
      <span
        className={`h-2 w-2 flex-shrink-0 rounded-full ${dotStyles[toast.type]}`}
      />
      <span className="text-[13px] font-medium text-white whitespace-nowrap">
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        className="ml-1 flex-shrink-0 text-[#555] transition-colors hover:text-white"
        aria-label="Dismiss"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L9.06 8l3.22 3.22a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
        </svg>
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { type ToastType, type Toast };
