"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { toast } from "sonner";

export default function NewTeachingRoomPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    building: "",
    floor: "",
    capacity: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      await api.post("school/teaching-rooms", {
        name: form.name.trim(),
        building: form.building || null,
        floor: form.floor ? parseInt(form.floor) : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
      toast.success("تم إضافة القاعة بنجاح");
      router.push("/timetable");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء الإضافة");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="إضافة قاعة تدريس جديدة"
        actions={
          <Link
            href="/timetable"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-bg hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" />
            عودة
          </Link>
        }
      />

      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold">اسم القاعة *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="مثال: القاعة أ, مخبر العلوم"
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-1.5 block text-sm font-semibold">المبنى</label>
            <input
              type="text"
              value={form.building}
              onChange={(e) => setForm({ ...form, building: e.target.value })}
              className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="مثال: المبنى الرئيسي"
            />
          </div>

          <div className="mb-5 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">الطابق</label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => setForm({ ...form, floor: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">السعة (مقعد)</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="30"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !form.name.trim()}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "جارٍ الحفظ..." : "حفظ القاعة"}
          </button>
        </form>
      </div>
    </div>
  );
}
