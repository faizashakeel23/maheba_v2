"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastKind = "ok" | "oops" | "info";

interface Toast {
  id: number;
  msg: string;
  kind: ToastKind;
}

const ToastCtx = createContext<(msg: string, kind?: ToastKind) => void>(
  () => {}
);

/** Pop a brand-styled toast (bottom-left, auto-dismiss). */
export const useToast = () => useContext(ToastCtx);

const STYLE: Record<ToastKind, string> = {
  ok: "bg-white text-plum-900 ring-emerald-200",
  oops: "bg-white text-plum-900 ring-blush-300",
  info: "bg-plum-900 text-white ring-plum-900",
};

const PREFIX: Record<ToastKind, string> = {
  ok: "✿ ",
  oops: "oopsie ♡ ",
  info: "",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((msg: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 left-4 z-50 flex w-[calc(100%-2rem)] max-w-xs flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto rounded-2xl px-4 py-2.5 font-body text-sm font-bold shadow-lg ring-1 ${STYLE[t.kind]}`}
          >
            {PREFIX[t.kind]}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
