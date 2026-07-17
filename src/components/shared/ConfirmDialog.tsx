"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

const variantStyles = {
  danger: {
    iconBg: "bg-[var(--icon-bg-danger)]",
    iconColor: "text-danger",
    buttonBg: "bg-danger hover:bg-danger/90",
  },
  warning: {
    iconBg: "bg-[var(--icon-bg-warning)]",
    iconColor: "text-warning",
    buttonBg: "bg-warning hover:bg-warning/90",
  },
  info: {
    iconBg: "bg-[var(--icon-bg-primary)]",
    iconColor: "text-primary",
    buttonBg: "bg-primary hover:bg-primary/90",
  },
};

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const t = useTranslations("common");
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={() => !loading && onOpenChange(false)}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "grid h-10 w-10 flex-shrink-0 place-items-center rounded-full",
              styles.iconBg
            )}
          >
            <AlertTriangle className={cn("h-5 w-5", styles.iconColor)} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-fg">{title}</h3>
            <p className="mt-1 text-sm text-muted">{description}</p>
          </div>
          <button
            onClick={() => !loading && onOpenChange(false)}
            className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="btn-base border border-border bg-surface text-fg hover:bg-bg disabled:opacity-50"
          >
            {cancelLabel || t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "btn-base text-white disabled:opacity-50",
              styles.buttonBg
            )}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                جارٍ التنفيذ...
              </span>
            ) : (
              confirmLabel || t("save")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
