"use client";

import { useEffect, useState } from "react";
import { Plus, Bed } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { StatsSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface Room {
  id: string;
  room_number: string;
  building: string;
  floor: number;
  capacity: number;
  gender: string;
  occupied: number;
}

export default function BoardingPage() {
  const { setTitle } = usePageTitle();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTitle("إدارة الإقامة");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/rooms", undefined, { silent: true })
      .then((res) => setRooms(Array.isArray(res) ? res : (res as any)?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const buildings = rooms.reduce((acc: Record<string, number>, r) => {
    acc[r.building] = (acc[r.building] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <Breadcrumbs items={[{ label: "الإقامة" }]} />

      <PageHeader
        title="إدارة الإقامة"
        actions={
          <Link href="/boarding/rooms/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة غرفة
          </Link>
        }
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <>
          {Object.keys(buildings).length > 0 && (
            <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {Object.entries(buildings).map(([name, count]) => (
                <div key={name} className="rounded-xl border border-border bg-surface p-4 shadow-[var(--shadow)]">
                  <div className="text-sm text-muted">{name}</div>
                  <div className="text-2xl font-bold">{count} غرفة</div>
                </div>
              ))}
            </div>
          )}

          <h3 className="mb-3 text-base font-semibold">مخطط الغرف</h3>
          {rooms.length === 0 ? (
            <EmptyState
              icon={Bed}
              title="لا توجد غرف بعد"
              description="أضف الغرف الأولى للإقامة"
              action={
                <Link
                  href="/boarding/rooms/new"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
                >
                  <Plus className="h-4 w-4" />
                  إضافة غرفة
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rooms.map((r) => {
                const ratio = r.capacity > 0 ? r.occupied / r.capacity : 0;
                const color = ratio >= 0.8 ? "var(--danger)" : ratio >= 0.5 ? "var(--warning)" : "var(--success)";
                const bgColor = ratio >= 0.8 ? "var(--icon-bg-danger)" : ratio >= 0.5 ? "var(--icon-bg-warning)" : "var(--icon-bg-success)";
                return (
                  <Link
                    key={r.id}
                    href={`/boarding/rooms/${r.room_number}`}
                    className="rounded-xl border border-border bg-surface p-4 text-center shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-accent"
                  >
                    <div className="mb-2 flex items-center justify-center">
                      <Bed className="h-6 w-6" style={{ color }} />
                    </div>
                    <div className="text-base font-bold">{r.room_number}</div>
                    <div className="text-xs text-muted">{r.building}</div>
                    <div className="mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: bgColor, color }}>
                      {r.occupied} / {r.capacity}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
