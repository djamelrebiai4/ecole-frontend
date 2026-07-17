"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, MapPin, Pencil } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { api } from "@/lib/api/client";

interface TeachingRoom {
  id: string;
  name: string;
  building: string | null;
  floor: number | null;
  capacity: number | null;
  is_active: boolean;
}

export default function TimetablePage() {
  const t = useTranslations("school.nav");
  const [rooms, setRooms] = useState<TeachingRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<any>("school/teaching-rooms")
      .then((res) => setRooms(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buildings = rooms.reduce((acc: Record<string, number>, r) => {
    const key = r.building || "أخرى";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title={t("timetable")}
        actions={
          <Link
            href="/timetable/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            إضافة قاعة
          </Link>
        }
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {Object.entries(buildings).map(([name, count]) => (
              <div key={name} className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                <div className="text-sm text-muted">{name}</div>
                <div className="text-2xl font-bold">{count} قاعة</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted">لا توجد قاعات تدريس بعد</p>
            ) : (
              rooms.map((r) => (
                <div
                  key={r.id}
                  className="group relative rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-accent"
                >
                  <Link href={`/timetable/${r.id}`} className="flex items-start gap-3.5">
                    <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[var(--icon-bg-primary)]" style={{ color: "var(--info)" }}>
                      <MapPin className="h-[22px] w-[22px]" />
                    </div>
                    <div className="flex-1">
                      <div className="text-base font-bold">{r.name}</div>
                      <div className="text-sm text-muted">
                        {r.building || ""}{r.building && r.floor ? " · " : ""}{r.floor ? `الطابق ${r.floor}` : ""}
                      </div>
                      <div className="mt-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                        {r.capacity ? `${r.capacity} مقعد` : "بدون سعة محددة"}
                      </div>
                    </div>
                  </Link>
                  <Link
                    href={`/timetable/${r.id}/edit`}
                    className="absolute left-3 top-3 rounded-md border border-border p-1.5 text-muted opacity-0 transition-all hover:bg-bg hover:text-accent group-hover:opacity-100"
                    title="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
