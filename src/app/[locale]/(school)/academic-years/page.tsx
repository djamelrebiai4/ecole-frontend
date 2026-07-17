"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar, CheckCircle, Archive, BarChart3, Play, Edit3, Star } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { api } from "@/lib/api/client";

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: "active" | "completed";
  completed_at?: string;
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'current' | 'completed'>('current');

  useEffect(() => {
    api.get<any>(`school/academic-years?includeCompleted=${view === 'completed'}`)
      .then((res) => setYears(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [view]);

  const handleComplete = async (yearId: string) => {
    if (!confirm("هل أنت متأكد من أنك تريد إتمام هذه السنة الدراسية؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    try {
      await api.patch(`school/academic-years/${yearId}/complete`);
      setYears(prev => prev.map(y =>
        y.id === yearId ? { ...y, status: 'completed', completed_at: new Date().toISOString() } : y
      ));
    } catch (err) {
      alert("خطأ أثناء إتمام السنة الدراسية");
    }
  };

  const handleSetCurrent = async (yearId: string) => {
    if (!confirm("هل أنت متأكد من أنك تريد تعيين هذه السنة كسنة حالية؟")) return;

    try {
      await api.patch(`school/academic-years/${yearId}/set-current`);
      setYears(prev => prev.map(y =>
        y.id === yearId ? { ...y, is_current: true } : { ...y, is_current: false }
      ));
    } catch (err) {
      alert("خطأ أثناء تعيين السنة الحالية");
    }
  };

  const handleReopen = async (yearId: string) => {
    if (!confirm("هل أنت متأكد من أنك تريد إعادة فتح هذه السنة الدراسية؟")) return;

    try {
      await api.put(`school/academic-years/${yearId}`, { status: 'active', is_current: false });
      setYears(prev => prev.map(y =>
        y.id === yearId ? { ...y, status: 'active' } : y
      ));
    } catch (err) {
      alert("خطأ أثناء إعادة فتح السنة الدراسية");
    }
  };

  const ActiveYearCard = ({ y }: { y: AcademicYear }) => (
    <div key={y.id} className="rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] relative">
      <div className="absolute top-3 left-3 flex gap-1">
        <Link
          href={`/academic-years/${y.id}/edit`}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-muted transition hover:border-primary hover:text-primary"
        >
          <Edit3 className="h-4 w-4" />
        </Link>
      </div>
      <div className="absolute top-3 right-3">
        <StatusBadge 
          status={y.is_current ? "active" : (y.status === "completed" ? "warning" : "default")} 
          label={y.is_current ? "الحالية" : (y.status === "completed" ? "مكتملة" : "نشطة")} 
        />
      </div>
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--icon-bg-primary)]">
          <Calendar className="h-5 w-5" style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1">
          <div className="font-semibold">{y.name}</div>
          <div className="text-xs text-muted">{y.start_date} → {y.end_date}</div>
          {y.status === "completed" && y.completed_at && (
            <div className="text-xs text-warning mt-1">تم الإنهاء في {new Date(y.completed_at).toLocaleDateString()}</div>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/academic-years/${y.id}/stats`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition hover:border-primary hover:text-primary"
        >
          <BarChart3 className="h-4 w-4" />
          الإحصائيات
        </Link>
        {y.status === "active" && !y.is_current && (
          <button
            onClick={() => handleSetCurrent(y.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-dark"
          >
            <Star className="h-4 w-4" />
            تعيين كحالية
          </button>
        )}
        {y.is_current && y.status === "active" && (
          <button
            onClick={() => handleComplete(y.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-warning px-4 py-2 text-sm font-semibold text-white transition hover:bg-warning-dark"
          >
            <CheckCircle className="h-4 w-4" />
            إتمام السنة
          </button>
        )}
        {y.status === "completed" && (
          <button
            onClick={() => handleReopen(y.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-white transition hover:bg-success-dark"
          >
            <Play className="h-4 w-4" />
            إعادة فتح
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title="السنوات الدراسية"
        actions={
          <div className="flex gap-2">
            <Link
              href="/academic-years/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
            >
              <Plus className="h-4 w-4" />
              إضافة سنة
            </Link>
            <button
              onClick={() => setView(v => v === 'current' ? 'completed' : 'current')}
              className="inline-flex items-center gap-1.5 rounded-lg bg-surface border border-border px-5 py-2.5 text-sm font-semibold text-fg transition hover:border-primary"
            >
              <Archive className="h-4 w-4" />
              {view === 'current' ? 'عرض السنوات المنتهية' : 'عرض السنوات النشطة'}
            </button>
          </div>
        }
      />

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setView('current')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'current' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:border-primary'}`}
        >
          السنوات النشطة
        </button>
        <button
          onClick={() => setView('completed')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${view === 'completed' ? 'bg-accent text-white' : 'bg-surface border border-border text-muted hover:border-primary'}`}
        >
          السنوات المنتهية ({years.filter(y => y.status === 'completed').length})
        </button>
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted">جاري التحميل...</p>
      ) : years.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">لا توجد سنوات دراسية {view === 'current' ? 'نشطة' : 'منتهية'}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {years.map((y) => <ActiveYearCard key={y.id} y={y} />)}
        </div>
      )}
    </div>
  );
}
