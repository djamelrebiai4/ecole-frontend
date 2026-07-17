"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2, Check } from "lucide-react";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";

interface ClassFeeTemplate {
  id: string;
  class_id: string;
  fee_category_id: string;
  amount: number;
  due_day: number | null;
  classes: { name: string } | null;
  fee_categories: { name: string } | null;
}

export default function FeeTemplatesPage() {
  const [templates, setTemplates] = useState<ClassFeeTemplate[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeCategories, setFeeCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<string | null>(null);
  const [form, setForm] = useState({ fee_category_id: "", amount: "", due_day: "" });

  useEffect(() => {
    Promise.all([
      api.get<any>("school/fee-templates", undefined, { silent: true }),
      api.get<any>("school/classes?limit=200", undefined, { silent: true }),
      api.get<any>("school/fee-categories", undefined, { silent: true }),
    ]).then(([t, c, fc]) => {
      setTemplates(Array.isArray(t) ? t : t.data ?? []);
      setClasses(Array.isArray(c) ? c : c.data ?? []);
      setFeeCategories(Array.isArray(fc) ? fc : fc.data ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const grouped = classes.map((cls) => ({
    class: cls,
    templates: templates.filter((t) => t.class_id === cls.id),
  })).filter((g) => g.templates.length > 0);

  const classesWithoutTemplates = classes.filter((cls) => !templates.some((t) => t.class_id === cls.id));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClass) return;
    setSaving(true);
    try {
      const created = await api.post<ClassFeeTemplate>("school/fee-templates", {
        class_id: selectedClass,
        fee_category_id: form.fee_category_id,
        amount: Number(form.amount),
        due_day: form.due_day ? Number(form.due_day) : undefined,
      });
      setTemplates((prev) => [...prev, created]);
      setShowModal(false);
      setForm({ fee_category_id: "", amount: "", due_day: "" });
    } catch {
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(templateId: string) {
    setDeleting(templateId);
    try {
      await api.delete(`school/fee-templates/${templateId}`, { silent: true });
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } catch {
    } finally {
      setDeleting(null);
    }
  }

  async function handleApply(classId: string) {
    setApplying(classId);
    setApplyResult(null);
    try {
      const res = await api.post<{ created: number }>(`school/fee-templates/${classId}/apply`, {});
      setApplyResult(`تم إضافة ${res.created} رسم`);
    } catch (err: any) {
      setApplyResult(err.message || "حدث خطأ");
    } finally {
      setApplying(null);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: "المالية", href: "/finance" }, { label: "قوالب الرسوم" }]} />

      <PageHeader
        title="قوالب الرسوم"
        subtitle="تحديد الرسوم المفروضة على كل فوج دراسي"
      />

      {applyResult && (
        <div className="mb-4 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">{applyResult}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted" /></div>
      ) : grouped.length === 0 && classesWithoutTemplates.length === 0 ? (
        <EmptyState icon={Loader2} title="لا توجد أفواج" description="أضف أفواجاً دراسية أولاً" />
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.class.id} className="rounded-xl border border-border bg-surface shadow-[var(--shadow)]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="text-base font-bold">{g.class.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedClass(g.class.id); setShowModal(true); }}
                    className="inline-flex items-center gap-1 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-dark"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    إضافة رسم
                  </button>
                  <button
                    onClick={() => handleApply(g.class.id)}
                    disabled={applying === g.class.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-accent px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent hover:text-white disabled:opacity-50"
                  >
                    {applying === g.class.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    تطبيق
                  </button>
                </div>
              </div>
              <div className="divide-y divide-border">
                {g.templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{t.fee_categories?.name || "-"}</span>
                      <span className="tabular-nums text-muted">{t.amount.toLocaleString()} د.ج</span>
                      {t.due_day && <span className="text-xs text-muted">يوم {t.due_day} من الشهر</span>}
                    </div>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={deleting === t.id}
                      className="rounded p-1.5 text-muted transition hover:bg-[var(--icon-bg-danger)] hover:text-danger disabled:opacity-30"
                    >
                      {deleting === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {classesWithoutTemplates.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)]">
              <h3 className="mb-3 text-base font-bold">أفواج بدون قوالب رسوم</h3>
              <div className="flex flex-wrap gap-2">
                {classesWithoutTemplates.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => { setSelectedClass(cls.id); setShowModal(true); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border bg-bg px-4 py-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => !saving && setShowModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="mb-4 text-lg font-bold">إضافة رسم للفوج</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-semibold">الفوج</label>
                <p className="text-sm text-muted">{classes.find((c) => c.id === selectedClass)?.name}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">الرسم <span className="text-red-500">*</span></label>
                <select value={form.fee_category_id} required
                  onChange={(e) => { const fc = feeCategories.find((f) => f.id === e.target.value); setForm((f) => ({ ...f, fee_category_id: e.target.value, amount: fc?.amount?.toString() ?? "" })); }}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent">
                  <option value="">-- اختر --</option>
                  {feeCategories.map((fc) => <option key={fc.id} value={fc.id}>{fc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">المبلغ (د.ج) <span className="text-red-500">*</span></label>
                <input type="number" value={form.amount} required min={1}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold">يوم الاستحقاق</label>
                <input type="number" min={1} max={31} value={form.due_day} placeholder="مثال: 10"
                  onChange={(e) => setForm((f) => ({ ...f, due_day: e.target.value }))}
                  className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {saving ? "جارٍ الحفظ..." : "إضافة"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} disabled={saving}
                  className="rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary disabled:opacity-50">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
