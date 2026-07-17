"use client";

import { useToast as useSonnerToast, Toaster as SonnerToaster, toast as sonnerToast } from "sonner";
import { useTranslations } from "next-intl";
import { CheckCircle, AlertCircle, AlertTriangle, Info, Loader2, X, ChevronRight } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info" | "loading" | "promise";

interface ToastOptions {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  dismissible?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
}

interface PromiseToastOptions<T> {
  loading?: string;
  success?: string | ((data: T) => string);
  error?: string | ((error: Error) => string);
}

export function useToast() {
  const sonner = useSonnerToast();
  const t = useTranslations("toast");

  const showToast = useCallback((
    type: ToastType,
    message: string,
    options: ToastOptions = {}
  ) => {
    const baseOptions = {
      description: options.description,
      action: options.action ? { label: options.action.label, onClick: options.action.onClick } : undefined,
      duration: options.duration ?? (type === "error" ? 6000 : type === "loading" ? Infinity : 4000),
      dismissible: options.dismissible ?? true,
      position: options.position || "top-right",
      classNames: {
        toast: "group rounded-xl border border-border bg-surface p-4 shadow-xl",
        description: "text-sm text-muted",
        actionButton: "inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90",
        closeButton: "text-muted hover:text-fg",
      },
    };

    switch (type) {
      case "success":
        return sonner.success(message, { ...baseOptions, icon: <SuccessIcon /> });
      case "error":
        return sonner.error(message, { ...baseOptions, icon: <ErrorIcon /> });
      case "warning":
        return sonner(message, { ...baseOptions, icon: <WarningIcon />, className: "border-warning/30 bg-warning/5" });
      case "info":
        return sonner(message, { ...baseOptions, icon: <InfoIcon /> });
      case "loading":
        return sonner.loading(message, { ...baseOptions, icon: <LoadingIcon /> });
      case "promise":
        return sonner.promise(options.action?.onClick as Promise<any>, {
          loading: options.description || t("loading"),
          success: options.action?.label || t("success"),
          error: t("error"),
        });
      default:
        return sonner(message, baseOptions);
    }
  }, [sonner, t]);

  return {
    success: (message: string, options?: ToastOptions) => showToast("success", message, options),
    error: (message: string, options?: ToastOptions) => showToast("error", message, options),
    warning: (message: string, options?: ToastOptions) => showToast("warning", message, options),
    info: (message: string, options?: ToastOptions) => showToast("info", message, options),
    loading: (message: string, options?: ToastOptions) => showToast("loading", message, options),
    promise: <T,>(promise: Promise<T>, messages: PromiseToastOptions<T>) =>
      sonner.promise(promise, {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      }),
    dismiss: sonner.dismiss,
    dismissAll: sonner.dismissAll,
  };
}

// Toast Icons
function SuccessIcon() {
  return (
    <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="h-5 w-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L21.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg className="h-5 w-5 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function LoadingIcon() {
  return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
}

// Enhanced Toaster Component
export function Toaster() {
  const t = useTranslations("toast");
  const isRTL = document.dir === "rtl";

  return (
    <SonnerToaster
      position="top-right"
      theme="system"
      toastOptions={{
        classNames: {
          toast: "group rounded-xl border border-border bg-surface p-4 shadow-xl",
          description: "text-sm text-muted",
          actionButton: "inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-primary/90",
          closeButton: "text-muted hover:text-fg",
        },
        duration: 4000,
        dismissible: true,
        closeButton: true,
        expandByDefault: false,
        hideCloseButton: false,
        iconTheme: {
          primary: "currentColor",
          secondary: "currentColor",
        },
      }}
      reverseOrder={false}
      gutters={16}
      containerClassName={cn("z-[100]", isRTL && "left-4 right-auto", !isRTL && "right-4 left-auto")}
    />
  );
}

// Specialized toast functions
export function useNotificationToast() {
  const { success, error, warning, info, dismiss } = useToast();
  const t = useTranslations("notifications.toast");

  return {
    paymentReceived: (amount: number, studentName: string) =>
      success(t("paymentReceived", { amount: amount.toLocaleString(), student: studentName }), {
        description: t("paymentReceivedDesc"),
        action: { label: t("viewPayments"), onClick: () => window.location.href = "/finance/payments" },
      }),

    studentRegistered: (name: string, code: string) =>
      success(t("studentRegistered", { name, code }), {
        description: t("studentRegisteredDesc"),
        action: { label: t("viewStudent"), onClick: () => window.location.href = `/students` },
      }),

    feeCreated: (feeName: string, studentName: string, amount: number) =>
      info(t("feeCreated", { fee: feeName, student: studentName, amount: amount.toLocaleString() }), {
        action: { label: t("viewStudent"), onClick: () => window.location.href = `/students` },
      }),

    attendanceAlert: (count: number, date: string) =>
      warning(t("attendanceAlert", { count, date }), {
        description: t("attendanceAlertDesc"),
        action: { label: t("viewAttendance"), onClick: () => window.location.href = `/attendance?date=${date}` },
      }),

    roomFull: (roomLabel: string) =>
      warning(t("roomFull", { room: roomLabel }), {
        description: t("roomFullDesc"),
        action: { label: t("viewRoom"), onClick: () => window.location.href = `/boarding` },
      }),

    academicYearCompleted: (yearName: string) =>
      success(t("yearCompleted", { year: yearName }), {
        description: t("yearCompletedDesc"),
        action: { label: t("viewYears"), onClick: () => window.location.href = `/academic-years` },
      }),

    subscriptionExpiring: (days: number, schoolName: string) =>
      warning(t("subscriptionExpiring", { days, school: schoolName }), {
        description: t("subscriptionExpiringDesc"),
        action: { label: t("renewNow"), onClick: () => window.location.href = `/settings` },
      }),

    subscriptionExpired: (schoolName: string) =>
      error(t("subscriptionExpired", { school: schoolName }), {
        description: t("subscriptionExpiredDesc"),
        action: { label: t("renewNow"), onClick: () => window.location.href = `/settings` },
        duration: 10000,
      }),

    staffAssigned: (name: string, role: string) =>
      info(t("staffAssigned", { name, role }), {
        action: { label: t("viewStaff"), onClick: () => window.location.href = `/staff` },
      }),

    noteAdded: (studentName: string, noteType: string) =>
      info(t("noteAdded", { student: studentName, type: noteType }), {
        action: { label: t("viewNotes"), onClick: () => window.location.href = `/notes` },
      }),

    chatMessage: (from: string, preview: string, conversationId: string) =>
      info(from, {
        description: preview.length > 50 ? preview.slice(0, 50) + "..." : preview,
        action: { label: t("reply"), onClick: () => window.location.href = `/chat/conversations/${conversationId}` },
      }),

    systemMaintenance: (date: string, time: string) =>
      warning(t("systemMaintenance", { date, time }), {
        description: t("systemMaintenanceDesc"),
        duration: 15000,
      }),

    custom: (type: "success" | "error" | "warning" | "info", title: string, options?: { description?: string; action?: { label: string; onClick: () => void } }) => {
      const map = { success, error, warning, info };
      return map[type](title, options);
    },
  };
}

// Toast for form submissions with validation errors
export function useFormToast() {
  const { error, success } = useToast();
  const t = useTranslations("forms.toast");

  return {
    submitError: (errors: Record<string, string>) => {
      const firstError = Object.values(errors)[0];
      error(t("submitError"), { description: firstError || t("unknownError") });
    },

    validationError: (field: string, message: string) => {
      error(t("validationError"), { description: `${field}: ${message}` });
    },

    submitSuccess: (message?: string) => success(message || t("submitSuccess")),

    saveSuccess: () => success(t("saveSuccess")),

    deleteSuccess: () => success(t("deleteSuccess")),

    updateSuccess: () => success(t("updateSuccess")),

    networkError: () => error(t("networkError"), { description: t("networkErrorDesc") }),

    permissionError: () => error(t("permissionError"), { description: t("permissionErrorDesc") }),
  };
}

// Auto-dismiss toasts on route change
export function useAutoDismissToasts() {
  const { dismissAll } = useToast();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    dismissAll();
  }, [pathname, dismissAll]);
}