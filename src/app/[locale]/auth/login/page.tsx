"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { GraduationCap, AlertCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GuestGuard } from "@/components/layout/AuthGuard";
import { useAuth } from "@/lib/auth/AuthContext";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError(t("errors.required"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.is_super_admin) {
        router.push("/super-admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.invalid");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GuestGuard>
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-primary to-primary-dark p-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -end-36 -top-52 h-[600px] w-[600px] rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.12)_0%,transparent_70%)]" />
        <div className="absolute -bottom-24 -start-24 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(5,150,105,0.08)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-[420px] rounded-2xl bg-surface p-8 shadow-[var(--shadow-lg)] md:p-10">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>

        <div className="mb-2 text-center">
          <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-primary">
            <GraduationCap className="h-7 w-7 fill-white text-white" />
          </div>
          <h1 className="text-[22px] font-bold tracking-tight text-fg">
            {t("loginTitle")}
          </h1>
          <p className="text-sm text-muted">{t("loginSubtitle")}</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-fg">
              {t("email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              required
              autoComplete="email"
              disabled={loading}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold text-fg">
              {t("password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("passwordPlaceholder")}
              required
              minLength={6}
              autoComplete="current-password"
              disabled={loading}
              className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="mb-6 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-1.5 text-muted">
              <input type="checkbox" className="h-4 w-4" />
              {t("rememberMe")}
            </label>
            <span className="font-medium text-accent cursor-default opacity-70">
              {t("forgotPassword")}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-[var(--shadow-lg)] disabled:opacity-70"
          >
            {loading ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <div className="mt-5 text-center text-[13px] text-muted">
          {t("noAccount")}{" "}
          <Link href="/auth/register" className="font-semibold text-accent hover:underline">
            {t("register")}
          </Link>
        </div>
      </div>
    </div>
    </GuestGuard>
  );
}
