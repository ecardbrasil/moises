"use client";

import type { ToastOptions } from "./ToastProvider";

export interface ToastItem extends ToastOptions {
  id: number;
}

interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export default function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:w-auto"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg ${
            t.variant === "error" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-700 bg-slate-900 text-white"
          }`}
        >
          <span className="min-w-0 flex-1">{t.message}</span>
          {t.actionLabel && (
            <button
              type="button"
              onClick={() => {
                t.onAction?.();
                onDismiss(t.id);
              }}
              className={`shrink-0 rounded px-2 py-1 text-xs font-semibold underline-offset-2 hover:underline ${
                t.variant === "error" ? "text-red-800" : "text-white"
              }`}
            >
              {t.actionLabel}
            </button>
          )}
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Fechar notificação"
            className={`shrink-0 rounded p-0.5 opacity-60 hover:opacity-100 ${t.variant === "error" ? "text-red-800" : "text-white"}`}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
