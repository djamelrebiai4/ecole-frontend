import { setRequestLocale } from "next-intl/server";
import { Download, FileText, Printer } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const reports = [
    { title: "تقرير المالية الشهري", subtitle: "يوليو 2026 - كل الإيرادات والمصاريف", type: "monthly" },
    { title: "تقرير المالية السنوي", subtitle: "2025-2026 - ملخص السنة الكاملة", type: "yearly" },
    { title: "تقرير التلاميذ المتأخرين", subtitle: "كل الرسوم المستحقة والمتأخرة", type: "overdue" },
    { title: "تقرير المداخيل حسب الفئة", subtitle: "تفصيل المداخيل حسب نوع الرسم", type: "income" },
    { title: "تقرير المصاريف حسب الفئة", subtitle: "تفصيل المصاريف حسب النوع", type: "expense" },
  ];

  return (
    <div>
      <PageHeader title="التقارير المالية" />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reports.map((r, i) => (
          <div key={i} className="flex items-start gap-4 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
            <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[var(--icon-bg-primary)]" style={{ color: "var(--primary)" }}>
              <FileText className="h-[22px] w-[22px]" />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold">{r.title}</div>
              <div className="text-sm text-muted">{r.subtitle}</div>
              <div className="mt-3 flex gap-2">
                <button className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark">
                  <Download className="h-3.5 w-3.5" />
                  PDF
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-primary hover:text-primary">
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
                <button className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-fg transition hover:border-primary hover:text-primary">
                  <Printer className="h-3.5 w-3.5" />
                  طباعة
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
