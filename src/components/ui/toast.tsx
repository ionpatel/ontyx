"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

// Toast Context
interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  duration?: number;
  action?: React.ReactNode;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => string;
  removeToast: (id: string) => void;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  // shadcn-compatible API
  toast: (opts: { title?: string; description?: string; variant?: string }) => string;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(
  undefined
);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { ...toast, id }]);

      const duration = toast.duration ?? 5000;
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }

      return id;
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = React.useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, variant: "success" }),
    [addToast]
  );

  const error = React.useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, variant: "error" }),
    [addToast]
  );

  const warning = React.useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, variant: "warning" }),
    [addToast]
  );

  const info = React.useCallback(
    (title: string, description?: string) =>
      addToast({ title, description, variant: "info" }),
    [addToast]
  );

  // shadcn-compatible toast() function
  const toast = React.useCallback(
    (opts: { title?: string; description?: string; variant?: string }) => {
      // Map shadcn variant names to our variants
      let variant: Toast['variant'] = 'default'
      if (opts.variant === 'destructive') variant = 'error'
      else if (opts.variant === 'success') variant = 'success'
      else if (opts.variant === 'warning') variant = 'warning'
      
      return addToast({ 
        title: opts.title, 
        description: opts.description, 
        variant 
      })
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info, toast }}
    >
      {children}
      <ToastViewport toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

// Variants
const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-lg transition-all",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-foreground",
        success: "bg-success/10 border-success/20 text-success",
        warning: "bg-warning/10 border-warning/20 text-warning",
        error: "bg-destructive/10 border-destructive/20 text-destructive",
        info: "bg-primary/10 border-primary/20 text-primary",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: null,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

// Individual Toast
interface ToastItemProps extends VariantProps<typeof toastVariants> {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = iconMap[toast.variant || "default"];

  return (
    <div
      className={cn(
        toastVariants({ variant: toast.variant }),
        "animate-in slide-in-from-right-full"
      )}
    >
      {Icon && <Icon className="h-5 w-5 shrink-0 mt-0.5" />}
      <div className="flex-1 space-y-1">
        {toast.title && (
          <p className="text-sm font-semibold leading-none">{toast.title}</p>
        )}
        {toast.description && (
          <p className="text-sm opacity-90">{toast.description}</p>
        )}
        {toast.action && <div className="mt-2">{toast.action}</div>}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:opacity-100 group-hover:opacity-70"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// Viewport
function ToastViewport({
  toasts,
  onRemove,
}: {
  toasts: Toast[];
  onRemove: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col gap-2 p-4 sm:max-w-[420px]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

export { ToastItem, toastVariants };
