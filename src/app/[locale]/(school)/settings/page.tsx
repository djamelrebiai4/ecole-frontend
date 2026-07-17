"use client";

import { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

export default function SettingsPage() {
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    api.get<any>("school/profile")
      .then((data) => {
        setSchool(data);
        setForm({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await api.put("school/profile", form);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>;

  return (
    <div>
      <PageHeader title="الإعدادات" />

      <div className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <h3 className="mb-4 text-base font-semibold text-fg">معلومات المدرسة</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">اسم المدرسة</label>
              <input
                type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">البريد الإلكتروني</label>
              <input
                type="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الهاتف</label>
              <input
                type="tel" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">العنوان</label>
              <input
                type="text" value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
          </div>
        </div>

        <Link
          href="/settings/users"
          className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition hover:border-accent"
        >
          <div>
            <div className="text-base font-semibold">إدارة المستخدمين</div>
            <div className="text-sm text-muted">إضافة وتعديل وإلغاء مستخدمي المدرسة</div>
          </div>
          <ArrowLeft className="h-4 w-4 text-muted rtl:rotate-180" />
        </Link>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
