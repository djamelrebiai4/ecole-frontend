"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-10 w-10",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-muted", sizeMap[size], className)}
    />
  );
}

export function LoadingPage({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[400px] items-center justify-center", className)}>
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function LoadingInline({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-4 text-sm text-muted">
      <LoadingSpinner size="sm" />
      {label && <span>{label}</span>}
    </div>
  );
}
