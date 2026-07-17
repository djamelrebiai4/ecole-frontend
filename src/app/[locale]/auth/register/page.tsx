"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { GraduationCap, AlertCircle, CheckCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { GuestGuard } from "@/components/layout/AuthGuard";
import { Link } from "@/i18n/routing";
import { api } from "@/lib/api/client";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const tAuthErrors = useTranslations("auth.errors");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [name, setName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !schoolName || !email || !password) {
      setError(t("errors.required"));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("errors.invalidEmail"));
      return;
    }

    if (password.length < 8) {
      setError(tAuthErrors("invalid_length"));
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setError(tAuthErrors("invalid_uppercase"));
      return;
    }

    if (!/[a-z]/.test(password)) {
      setError(tAuthErrors("invalid_lowercase"));
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError(tAuthErrors("invalid_number"));
      return;
    }

    if (password !== confirmPassword) {
      setError(tCommon("confirmPassword"));
      return;
    }

    setLoading(true);

    try {
      await api.post("auth/register", { name, schoolName, email, password });
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("registration_failed");
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
              {locale === "ar" ? "إنشاء حساب جديد" : "Create Account"}
            </h1>
            <p className="text-sm text-muted">
              {locale === "ar" ? "سجل مؤسستك في المنصة" : "Register your school on the platform"}
            </p>
          </div>

          {success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-[var(--icon-bg-success)] px-3.5 py-2.5 text-sm text-success">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>{locale === "ar" ? "تم التسجيل بنجاح! جارٍ تحويلك إلى صفحة الدخول..." : "Registration successful! Redirecting to login..."}</span>
            </div>
          )}

          {error && !success && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-danger/30 bg-[var(--icon-bg-danger)] px-3.5 py-2.5 text-sm text-danger">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-fg">
                  {locale === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={locale === "ar" ? "أحمد بن علي" : "Ahmed Ben Ali"}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-fg">
                  {locale === "ar" ? "اسم المؤسسة" : "School Name"}
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={locale === "ar" ? "مدرسة الفلاح" : "Al Falah School"}
                  required
                  disabled={loading}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-fg">{t("email")}</label>
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

              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-fg">{t("password")}</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("passwordPlaceholder")}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-semibold text-fg">
                  {locale === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === "ar" ? "أعد إدخال كلمة المرور" : "Re-enter password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={loading}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-3 text-[15px] text-fg outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-accent px-4 py-3 text-base font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-[var(--shadow-lg)] disabled:opacity-70"
              >
                {loading
                  ? (locale === "ar" ? "جارٍ التسجيل..." : "Registering...")
                  : (locale === "ar" ? "إنشاء الحساب" : "Create Account")}
              </button>
            </form>
          )}

          <div className="mt-5 text-center text-[13px] text-muted">
            {locale === "ar" ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
            <Link href="/auth/login" className="font-semibold text-accent hover:underline">
              {locale === "ar" ? "تسجيل الدخول" : "Sign in"}
            </Link>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
