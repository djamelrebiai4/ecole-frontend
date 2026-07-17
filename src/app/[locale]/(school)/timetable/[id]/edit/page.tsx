"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";
import { toast } from "sonner";
import type { TeachingRoom } from "@/types/timetable";

export default function EditTeachingRoomPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", building: "", floor: "", capacity: "" });

  useEffect(() => {
    api.get<TeachingRoom>(`school/teaching-rooms/${params.id}`)
      .then((room) => {
        setForm({
          name: room.name,
          building: room.building || "",
          floor: room.floor?.toString() || "",
          capacity: room.capacity?.toString() || "",
        });
      })
      .catch(() => toast.error("فشل تحميل بيانات القاعة"))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.put(`school/teaching-rooms/${params.id}`, {
        name: form.name.trim(),
        building: form.building || null,
        floor: form.floor ? parseInt(form.floor) : null,
        capacity: form.capacity ? parseInt(form.capacity) : null,
      });
      toast.success("تم تحديث القاعة بنجاح");
      router.push("/timetable");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التحديث");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="تعديل القاعة"
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
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">السعة (مقعد)</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/timetable"
              className="flex-1 rounded-lg border border-border px-4 py-2.5 text-center text-sm font-semibold text-muted transition-all hover:bg-bg"
            >
              إلغاء
            </Link>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "جارٍ الحفظ..." : "حفظ التعديلات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
