"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Mail, Phone, Briefcase, Users, ShieldCheck, Building2 } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

interface StaffRow {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  staff_type: string;
  email: string;
  phone: string;
  specialization: string;
  is_active: boolean;
}

const typeMap: Record<string, string> = {
  teacher: "أستاذ", supervisor: "مشرف", admin_staff: "إداري",
};

const typeIcons: Record<string, typeof Briefcase> = {
  teacher: Users,
  supervisor: ShieldCheck,
  admin_staff: Building2,
};

const typeColors: Record<string, { bg: string; fg: string }> = {
  teacher: { bg: "var(--icon-bg-primary)", fg: "var(--primary)" },
  supervisor: { bg: "var(--icon-bg-success)", fg: "var(--success)" },
  admin_staff: { bg: "var(--icon-bg-warning)", fg: "var(--warning)" },
};

const tabs = [
  { key: "all", label: "الكل" },
  { key: "teacher", label: "الأساتذة" },
  { key: "supervisor", label: "المشرفون" },
  { key: "admin_staff", label: "الإداريون" },
];

export default function StaffPage() {
  const t = useTranslations("school.staff");
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("teacher");
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle("الموظفون");
  }, [setTitle]);

  useEffect(() => {
    api.get<any>("school/staff?limit=100", undefined, { silent: true })
      .then((res) => setStaff(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === "all"
    ? staff
    : staff.filter((s) => s.staff_type === activeTab);

  const teacherCount = staff.filter((s) => s.staff_type === "teacher").length;
  const supervisorCount = staff.filter((s) => s.staff_type === "supervisor").length;
  const adminCount = staff.filter((s) => s.staff_type === "admin_staff").length;

  return (
    <div>
      <Breadcrumbs items={[{ label: "الموظفون" }]} />

      <PageHeader
        title="الموظفون"
        subtitle={`${staff.length} موظف (${teacherCount} أستاذ، ${supervisorCount} مشرف، ${adminCount} إداري)`}
        actions={
          <Link href="/staff/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
            <Plus className="h-4 w-4" />
            إضافة موظف
          </Link>
        }
      />

      <div className="mb-5 flex gap-1 rounded-lg border border-border bg-surface p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:bg-bg hover:text-fg"
            }`}
          >
            {tab.label}
            {tab.key === "teacher" && ` (${teacherCount})`}
            {tab.key === "supervisor" && ` (${supervisorCount})`}
            {tab.key === "admin_staff" && ` (${adminCount})`}
          </button>
        ))}
      </div>

      {loading ? (
        <CardSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={`لا يوجد ${activeTab === "teacher" ? "أساتذة" : activeTab === "supervisor" ? "مشرفون" : activeTab === "admin_staff" ? "إداريون" : "موظفون"} بعد`}
          description="قم بإضافة أول موظف في النظام"
          action={
            <Link href="/staff/new" className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark">
              <Plus className="h-4 w-4" />
              إضافة موظف
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const Icon = typeIcons[s.staff_type] || Briefcase;
            const colors = typeColors[s.staff_type] || { bg: "var(--icon-bg-primary)", fg: "var(--primary)" };
            return (
              <Link
                key={s.id}
                href={`/staff/${s.id}`}
                className="block rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition hover:border-primary"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl"
                    style={{ background: colors.bg, color: colors.fg }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{s.full_name || `${s.first_name} ${s.last_name}`}</div>
                    <span className="text-xs font-semibold text-accent">{typeMap[s.staff_type] || s.staff_type}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm text-muted">
                  {s.specialization && <div className="text-xs">{s.specialization}</div>}
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" />
                    {s.email || "-"}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {s.phone || "-"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
