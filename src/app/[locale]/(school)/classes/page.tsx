"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Search, Users } from "lucide-react";
import { Link } from "@/i18n/routing";
import { PageHeader } from "@/components/shared/PageHeader";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { CardSkeleton } from "@/components/shared/Skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { api } from "@/lib/api/client";
import { usePageTitle } from "@/lib/page-title";

const LEVELS = ["1 متوسط", "2 متوسط", "3 متوسط", "4 متوسط", "1 ثانوي", "2 ثانوي", "3 ثانوي"];

interface ClassRow {
  id: string;
  name: string;
  level: string;
  capacity: number;
  room_number: string;
}

export default function ClassesPage() {
  const t = useTranslations("school.nav");
  const tCommon = useTranslations("common");
  const tClasses = useTranslations("school.classes");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const { setTitle } = usePageTitle();

  useEffect(() => {
    setTitle(t("classes"));
  }, [setTitle, t]);

  useEffect(() => {
    api.get<any>("school/classes", undefined, { silent: true })
      .then((res) => setClasses(Array.isArray(res) ? res : res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = classes.filter((c) => {
    const matchesSearch = !q || c.name.toLowerCase().includes(q);
    const matchesLevel = !levelFilter || c.level === levelFilter;
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <Breadcrumbs items={[{ label: t("classes") }]} />

      <PageHeader
        title={t("classes")}
        subtitle={!loading ? `${classes.length} فوج` : undefined}
        actions={
          <Link
            href="/classes/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
          >
            <Plus className="h-4 w-4" />
            {tCommon("addNew")}
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute top-1/2 start-3 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder={tCommon("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border-[1.5px] border-border bg-surface py-2.5 pe-3 ps-10 text-sm outline-none focus:border-accent"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="w-full rounded-lg border-[1.5px] border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent sm:w-auto"
        >
          <option value="">{t("all")}</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <CardSkeleton count={6} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q || levelFilter ? tCommon("noResults") : t("noClasses")}
          description={q || levelFilter ? tCommon("tryDifferent") : t("addFirst")}
          action={
            !q && !levelFilter ? (
              <Link
                href="/classes/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark"
              >
                <Plus className="h-4 w-4" />
                {tCommon("addNew")}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/classes/${c.id}`}
              className="flex items-start gap-3.5 rounded-xl border border-border bg-surface p-5 shadow-[var(--shadow)] transition-all hover:-translate-y-0.5 hover:border-accent"
            >
              <div className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[var(--icon-bg-success)]" style={{ color: "var(--success)" }}>
                <Users className="h-[22px] w-[22px]" />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold">{c.name}</div>
                <div className="text-sm text-muted">{t("levelLabel")} {c.level || "-"} · {t("roomLabel")} {c.room_number || "-"}</div>
                <div className="mt-1 text-sm font-semibold" style={{ color: "var(--primary)" }}>
                  {c.capacity || 0} {t("seats")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
