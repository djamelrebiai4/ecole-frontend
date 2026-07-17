"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function NewSchoolPage() {
  const t = useTranslations("superAdmin.schools");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    plan_slug: "small",
    billing_cycle: "monthly",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("admin/schools", {
        ...form,
        slug: form.name
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .trim() || `school-${Date.now()}`,
      });
      router.push("/super-admin/schools");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("addNew")}
        actions={
          <Link
            href="/super-admin/schools"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
        <div>
          <h3 className="mb-4 text-base font-semibold text-fg">معلومات المدرسة</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-fg">اسم المدرسة</label>
              <input id="name" name="name" value={form.name} onChange={handleChange} required className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-fg">البريد الإلكتروني</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-fg">الهاتف</label>
              <input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
            <div>
              <label htmlFor="address" className="mb-1.5 block text-sm font-semibold text-fg">العنوان</label>
              <input id="address" name="address" value={form.address} onChange={handleChange} className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-base font-semibold text-fg">الباقة والاشتراك</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="plan_slug" className="mb-1.5 block text-sm font-semibold text-fg">الباقة</label>
              <select id="plan_slug" name="plan_slug" value={form.plan_slug} onChange={handleChange} className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent">
                <option value="small">صغيرة (حتى 100 تلميذ) - 1,500 د.ج/شهر</option>
                <option value="medium">متوسطة (حتى 300 تلميذ) - 2,500 د.ج/شهر</option>
                <option value="large">كبيرة (غير محدود) - 4,000 د.ج/شهر</option>
              </select>
            </div>
            <div>
              <label htmlFor="billing_cycle" className="mb-1.5 block text-sm font-semibold text-fg">دورية الدفع</label>
              <select id="billing_cycle" name="billing_cycle" value={form.billing_cycle} onChange={handleChange} className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent">
                <option value="monthly">شهرياً</option>
                <option value="yearly">سنوياً (مخفض)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-border pt-5">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "جاري الحفظ..." : "حفظ وإضافة المدرسة"}
          </button>
          <Link
            href="/super-admin/schools"
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
