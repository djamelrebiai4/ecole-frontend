"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  AlertCircle, AlertTriangle, CheckCircle, Info, X, RefreshCw, Home, WifiOff,
  Bug, ClipboardCopy, Mail, ExternalLink, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorInfo {
  message: string;
  code?: string;
  status?: number;
  stack?: string;
  timestamp: Date;
  url: string;
  userAgent: string;
  userId?: string;
  context?: Record<string, any>;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      context: { componentStack: errorInfo.componentStack },
    };

    this.setState({ errorInfo: errInfo });

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }

    // Report to error tracking service
    this.reportError(errInfo);

    this.props.onError?.(error, errInfo);
  }

  private async reportError(errorInfo: ErrorInfo) {
    try {
      // In production, send to your error tracking service (Sentry, LogRocket, etc.)
      if (process.env.NODE_ENV === "production") {
        await fetch("/api/errors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(errorInfo),
        }).catch(() => {}); // Silent fail
      }
    } catch {}
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <DefaultErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} reset={() => this.setState({ hasError: false, error: null, errorInfo: null })} />;
    }
    return this.props.children;
  }
}

function DefaultErrorFallback({ error, errorInfo, reset }: { error: Error | null; errorInfo: ErrorInfo | null; reset: () => void }) {
  const t = useTranslations("errorBoundary");
  const [copied, setCopied] = useState(false);

  const copyError = () => {
    const text = `${error?.message}\n\n${errorInfo?.stack || ""}\n\nURL: ${errorInfo?.url}\nTime: ${errorInfo?.timestamp.toISOString()}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 grid h-14 w-14 place-items-center rounded-xl bg-destructive/10">
            <AlertCircle className="h-7 w-7 text-destructive" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-fg">{t("somethingWentWrong")}</h1>
            <p className="mt-1 text-muted">{t("unexpectedError")}</p>
          </div>
        </div>

        {error && (
          <details className="mt-6 rounded-lg border border-border bg-muted/50">
            <summary className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-fg cursor-pointer">
              <AlertTriangle className="h-4 w-4 text-warning" />
              {t("errorDetails")}
            </summary>
            <div className="p-4 font-mono text-xs text-fg/80 bg-surface border-t border-border overflow-auto max-h-64">
              <p className="font-medium mb-2">{error.message}</p>
              {errorInfo?.stack && <pre className="whitespace-pre-wrap">{errorInfo.stack}</pre>}
              <div className="mt-4 space-y-1 text-xs text-muted">
                <p><strong>URL:</strong> {errorInfo?.url}</p>
                <p><strong>Time:</strong> {errorInfo?.timestamp.toLocaleString("ar-DZ")}</p>
                <p><strong>User Agent:</strong> {errorInfo?.userAgent}</p>
              </div>
            </div>
          </details>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button onClick={reset} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90">
            <RefreshCw className="h-4 w-4" />
            {t("tryAgain")}
          </button>
          <button onClick={() => window.location.href = "/"} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-bg">
            <Home className="h-4 w-4" />
            {t("goHome")}
          </button>
          <button onClick={copyError} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-bg" disabled={copied}>
            <ClipboardCopy className="h-4 w-4" />
            {copied ? t("copied") : t("copyError")}
          </button>
          <button onClick={() => window.open("mailto:support@ecole.dz?subject=Error Report&body=" + encodeURIComponent(error?.message || ""))} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition hover:bg-bg">
            <Mail className="h-4 w-4" />
            {t("reportError")}
          </button>
        </div>

        {process.env.NODE_ENV === "development" && errorInfo?.context?.componentStack && (
          <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
            <h3 className="mb-2 text-sm font-medium text-muted">{t("componentStack")}</h3>
            <pre className="font-mono text-xs text-fg/70 bg-surface p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">{errorInfo.context.componentStack}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default ErrorBoundary;

// Hook for programmatic error reporting
export function useErrorReporter() {
  const reportError = useCallback((error: Error, context?: Record<string, any>) => {
    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context,
    };

    if (process.env.NODE_ENV === "production") {
      fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(errorInfo),
      }).catch(() => {});
    } else {
      console.error("Reported error:", errorInfo);
    }
  }, []);

  return { reportError };
}

// Network status component
export function NetworkStatus() {
  const [online, setOnline] = useState(true);
  const [wasOffline, setWasOffline] = useState(false);
  const t = useTranslations("networkStatus");

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      if (wasOffline) {
        setWasOffline(false);
        // Trigger data refresh
        window.dispatchEvent(new CustomEvent("network:online"));
      }
    };
    const handleOffline = () => {
      setOnline(false);
      setWasOffline(true);
    };

    setOnline(navigator.onLine);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [wasOffline]);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-warning bg-warning/10 px-4 py-2 text-center text-sm font-medium text-warning/90" role="alert">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>{t("offline")}</span>
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-warning" />
      </div>
    </div>
  );
}

// Global error handler for unhandled promise rejections
export function setupGlobalErrorHandlers() {
  if (typeof window === "undefined") return;

  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    console.error("Unhandled rejection:", error);

    // Report to error tracking
    if (process.env.NODE_ENV === "production") {
      fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          type: "unhandledrejection",
        }),
      }).catch(() => {});
    }
  });

  window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
  });
}