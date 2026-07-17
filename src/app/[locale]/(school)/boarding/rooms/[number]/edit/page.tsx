"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Save, Loader2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { LoadingPage } from "@/components/shared/LoadingSpinner";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

export default function EditRoomPage() {
  const params = useParams<{ number: string }>();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [roomId, setRoomId] = useState("");
  const [form, setForm] = useState({
    room_number: "",
    capacity: "",
    building: "",
    floor: "",
    room_type: "",
    gender: "",
  });

  useEffect(() => {
    setTitle("تعديل الغرفة");
  }, [setTitle]);

  useEffect(() => {
    if (!params?.number) return;
    (async () => {
      try {
        const res = await api.get<any>("school/rooms", undefined, { silent: true });
        const roomsList = Array.isArray(res) ? res : (res as any)?.data ?? [];
        const found = roomsList.find((r: any) => r.room_number === params.number);
        if (!found) {
          setError("الغرفة غير موجودة");
          setLoading(false);
          return;
        }
        setRoomId(found.id);
        setForm({
          room_number: found.room_number || "",
          capacity: String(found.capacity || ""),
          building: found.building || "",
          floor: found.floor != null ? String(found.floor) : "",
          room_type: found.room_type || "",
          gender: found.gender || "",
        });
      } catch { /* silent */ }
      setLoading(false);
    })();
  }, [params?.number]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId) return;
    setSaving(true);
    setError("");
    try {
      await api.put(`school/rooms/${roomId}`, {
        room_number: form.room_number || undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
        building: form.building || null,
        floor: form.floor ? Number(form.floor) : null,
        room_type: form.room_type || null,
        gender: form.gender || null,
      }, { silent: true });
      router.push(`/boarding/rooms/${form.room_number}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingPage />;

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "الإقامة", href: "/boarding" },
          { label: `غرفة ${form.room_number || params.number}`, href: `/boarding/rooms/${params.number}` },
          { label: "تعديل" },
        ]}
      />

      <PageHeader
        title={`تعديل الغرفة ${form.room_number || params.number}`}
        actions={
          <Link
            href={`/boarding/rooms/${params.number}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            رجوع
          </Link>
        }
      />

      <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-xl border border-border bg-surface p-6 shadow-[var(--shadow)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">رقم الغرفة <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.room_number}
                required
                onChange={(e) => set("room_number", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">السعة <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.capacity}
                required
                onChange={(e) => set("capacity", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">المبنى</label>
              <input
                type="text"
                value={form.building}
                onChange={(e) => set("building", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الطابق</label>
              <input
                type="number"
                value={form.floor}
                onChange={(e) => set("floor", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">نوع الغرفة</label>
              <select
                value={form.room_type}
                onChange={(e) => set("room_type", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">-- اختر --</option>
                <option value="dormitory">عنبر</option>
                <option value="shared">مشتركة</option>
                <option value="private">خاصة</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-fg">الجنس</label>
              <select
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full rounded-lg border-[1.5px] border-border bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-accent"
              >
                <option value="">-- اختر --</option>
                <option value="male">ذكور</option>
                <option value="female">إناث</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <Link
            href={`/boarding/rooms/${params.number}`}
            className="inline-flex items-center rounded-lg border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
