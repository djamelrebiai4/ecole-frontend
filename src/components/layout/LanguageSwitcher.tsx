"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/routing";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const toggleLocale = () => {
    const nextLocale = locale === "ar" ? "en" : "ar";
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <button
      onClick={toggleLocale}
      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted transition-all hover:border-primary hover:text-primary"
      aria-label="Switch language"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === "ar" ? "EN" : "عربي"}
    </button>
  );
}
