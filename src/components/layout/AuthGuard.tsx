"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthGuard({ children, requireSuperAdmin }: { children: React.ReactNode; requireSuperAdmin?: boolean }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (requireSuperAdmin && !user.is_super_admin) {
      router.replace("/dashboard");
    }
  }, [user, isLoading, requireSuperAdmin, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  if (!user) return null;

  if (requireSuperAdmin && !user.is_super_admin) return null;

  return <>{children}</>;
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      router.replace(user.is_super_admin ? "/super-admin/dashboard" : "/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
