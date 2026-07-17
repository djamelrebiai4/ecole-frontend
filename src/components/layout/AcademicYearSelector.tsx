"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAcademicYears } from "@/contexts/AcademicYearContext";
import { Calendar, ChevronDown, Check } from "lucide-react";

export function AcademicYearSelector() {
  const { years, selectedYearId, setSelectedYear, currentYear } = useAcademicYears();
  const t = useTranslations("academicYears");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = years.find(y => y.id === selectedYearId);
  const label = selected?.name || currentYear?.name || "...";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (years.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-bg px-2.5 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface"
      >
        <Calendar className="h-3.5 w-3.5 text-muted" />
        <span>{label}</span>
        <ChevronDown className={`h-3 w-3 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute end-0 top-full z-[200] mt-1 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg">
          {years.map(y => (
            <button
              key={y.id}
              onClick={() => { setSelectedYear(y.id); setOpen(false); }}
              className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors ${
                y.id === selectedYearId
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-fg hover:bg-bg"
              }`}
            >
              <span className="flex-1">{y.name}</span>
              {y.is_current && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {t("current")}
                </span>
              )}
              {y.status === "completed" && (
                <span className="rounded bg-muted/20 px-1.5 py-0.5 text-[10px] text-muted">
                  {t("completed")}
                </span>
              )}
              {y.id === selectedYearId && (
                <Check className="h-3.5 w-3.5 shrink-0 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
