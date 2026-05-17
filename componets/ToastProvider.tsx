'use client';

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastVariant = 'default' | 'success' | 'warning' | 'destructive';

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
};

type Toast = ToastInput & {
  id: string;
  variant: ToastVariant;
  duration: number;
};

type ToastContextValue = {
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function createToastId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const variantStyles: Record<ToastVariant, string> = {
  default: 'border-black/10 bg-white text-[#09090b] dark:border-white/10 dark:bg-[#18181b] dark:text-[#fafafa]',
  success: 'border-emerald-500/20 bg-white text-[#09090b] dark:border-emerald-400/20 dark:bg-[#18181b] dark:text-[#fafafa]',
  warning: 'border-amber-500/25 bg-white text-[#09090b] dark:border-amber-400/25 dark:bg-[#18181b] dark:text-[#fafafa]',
  destructive: 'border-red-500/25 bg-white text-[#09090b] dark:border-red-400/25 dark:bg-[#18181b] dark:text-[#fafafa]',
};

const iconStyles: Record<ToastVariant, string> = {
  default: 'text-[#71717a]',
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  destructive: 'text-red-500',
};

const ToastIcon = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: AlertTriangle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback((input: ToastInput) => {
    const id = createToastId();
    const nextToast: Toast = {
      id,
      title: input.title,
      description: input.description,
      variant: input.variant ?? 'default',
      duration: input.duration ?? 3600,
    };

    setToasts((current) => [...current.slice(-3), nextToast]);
    return id;
  }, []);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-4 right-4 z-[100] flex w-[calc(100vw-2rem)] max-w-[380px] flex-col gap-2 sm:bottom-5 sm:right-5"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} toast={item} onDismiss={dismiss} />
        ))}
      </div>
      <style jsx global>{`
        @keyframes toastIn {
          from {
            opacity: 0;
            transform: translate3d(0, 8px, 0) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = ToastIcon[toast.variant];

  useEffect(() => {
    if (toast.duration === Infinity) return;
    const timeout = window.setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => window.clearTimeout(timeout);
  }, [onDismiss, toast.duration, toast.id]);

  return (
    <div
      role={toast.variant === 'destructive' ? 'alert' : 'status'}
      className={`group relative isolate overflow-hidden rounded-[12px] border p-3 pr-9 shadow-[0_18px_45px_rgba(15,23,42,0.13)] backdrop-blur-xl animate-[toastIn_0.22s_cubic-bezier(0.16,1,0.3,1)] dark:shadow-[0_18px_45px_rgba(0,0,0,0.38)] ${variantStyles[toast.variant]}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.55),transparent_42%)] opacity-80 dark:opacity-10" />
      <div className="relative z-10 flex gap-2.5">
        <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconStyles[toast.variant]}`} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-5 tracking-[-0.01em]">{toast.title}</div>
          {toast.description && (
            <div className="mt-0.5 text-[12px] font-medium leading-5 tracking-[-0.01em] text-[#71717a]">
              {toast.description}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2.5 top-2.5 z-20 grid h-6 w-6 place-items-center rounded-md text-[#a1a1aa] transition hover:bg-black/5 hover:text-[#09090b] dark:hover:bg-white/10 dark:hover:text-[#fafafa]"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
