"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Check, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, Filter, Search, X, MoreHorizontal,
  ArrowUpDown, FileText, FileSpreadsheet, Eye, Edit, Trash2, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { value: string; label: string }[];
  width?: string;
  align?: "left" | "center" | "right";
  sticky?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageChange?: (page: number, pageSize: number) => void;
  };
  sorting?: {
    enabled: boolean;
    defaultSort?: { key: string; direction: "asc" | "desc" };
    onSortChange?: (key: string, direction: "asc" | "desc") => void;
  };
  selection?: {
    enabled: boolean;
    onSelectionChange?: (selectedIds: string[]) => void;
    bulkActions?: BulkAction[];
  };
  rowActions?: RowAction<T>[];
  rowClick?: (row: T) => void;
  stickyHeader?: boolean;
  maxHeight?: string;
  className?: string;
  exportable?: boolean;
  exportFileName?: string;
  printable?: boolean;
}

interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  action: (selectedRows: any[]) => void;
  variant?: "default" | "danger";
  confirmMessage?: string;
}

interface RowAction<T> {
  label: string;
  icon: React.ReactNode;
  action: (row: T) => void;
  variant?: "default" | "danger" | "ghost";
  tooltip?: string;
  condition?: (row: T) => boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage,
  emptyAction,
  searchable = true,
  searchPlaceholder,
  searchKeys = [],
  pagination,
  sorting,
  selection,
  rowActions,
  rowClick,
  stickyHeader = true,
  maxHeight = "600px",
  className,
  exportable = false,
  exportFileName = "export",
  printable = false,
}: DataTableProps<T>) {
  const t = useTranslations("dataTable");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(
    sorting?.defaultSort ? { key: sorting.defaultSort.key, direction: sorting.defaultSort.direction } : null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 20);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showColumnMenu, setShowColumnMenu] = useState<string | null>(null);
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<HTMLElement | null>(null);

  // Filter data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const keys = searchKeys.length > 0 ? searchKeys : columns.map(c => c.key as keyof T);
      result = result.filter(row =>
        keys.some(key => {
          const value = row[key as keyof T];
          return value != null && String(value).toLowerCase().includes(q);
        })
      );
    }

    // Column filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter(row => {
          const cellValue = row[key];
          return cellValue != null && String(cellValue).toLowerCase().includes(value.toLowerCase());
        });
      }
    });

    // Sorting
    if (sortConfig) {
      const { key, direction } = sortConfig;
      const column = columns.find(c => c.key === key);
      result.sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return direction === "asc" ? 1 : -1;
        if (bVal == null) return direction === "asc" ? -1 : 1;

        let comparison = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: "base" });
        } else {
          comparison = String(aVal).localeCompare(String(bVal), undefined, { numeric: true, sensitivity: "base" });
        }
        return direction === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig, columns, searchKeys]);

  // Pagination
  const paginatedData = useMemo(() => {
    if (!pagination?.enabled) return filteredData;
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize, pagination]);

  const totalPages = pagination?.enabled ? Math.ceil(filteredData.length / pageSize) : 1;

  // Selection handlers
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      const ids = paginatedData.map(keyExtractor);
      setSelectedRows(new Set(ids));
      setSelectAll(true);
    } else {
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  }, [paginatedData, keyExtractor]);

  const handleRowSelect = useCallback((id: string, checked: boolean) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const isRowSelected = useCallback((id: string) => selectedRows.has(id), [selectedRows]);

  const selectedCount = selectedRows.size;
  const allSelected = paginatedData.length > 0 && selectedCount === paginatedData.length;
  const indeterminate = selectedCount > 0 && selectedCount < paginatedData.length;

  // Selection effect for bulk actions
  useEffect(() => {
    if (selection?.onSelectionChange) {
      selection.onSelectionChange(Array.from(selectedRows));
    }
  }, [selectedRows, selection]);

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, sortConfig]);

  // Handle sort
  const handleSort = useCallback((key: string) => {
    if (!sorting?.enabled) return;
    const column = columns.find(c => c.key === key);
    if (!column?.sortable) return;

    setSortConfig(current => {
      const next: { key: string; direction: "asc" | "desc" } = {
        key,
        direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
      };
      sorting?.onSortChange?.(key, next.direction);
      return next;
    });
  }, [columns, sorting]);

  // Handle filter
  const handleFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Export CSV
  const handleExport = useCallback(() => {
    const exportData = exportable && pagination?.enabled ? filteredData : paginatedData;
    const headers = columns.map(c => c.header);
    const rows = exportData.map(row => columns.map(c => {
      const value = row[c.key];
      if (value == null) return "";
      if (typeof value === "object") return JSON.stringify(value);
      return String(value).includes(",") ? `"${String(value).replace(/"/g, '""')}"` : String(value);
    }));

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  }, [columns, exportable, exportFileName, filteredData, paginatedData, pagination]);

  // Print
  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headers = columns.map(c => c.header);
    const rows = paginatedData.map(row => columns.map(c => {
      const value = row[c.key];
      return value != null ? String(value) : "";
    }));

    const html = `
      <html dir="${document.dir || 'rtl'}">
        <head>
          <title>${exportFileName}</title>
          <style>
            body { font-family: 'Cairo', 'Inter', sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background: #f3f4f6; font-weight: bold; }
            tr:nth-child(even) td { background: #f9fafb; }
            h1 { text-align: center; color: #1e3a5f; margin-bottom: 5px; }
            .meta { text-align: center; color: #6b7280; margin-bottom: 20px; font-size: 14px; }
          </style>
        </head>
        <body>
          <h1>${exportFileName}</h1>
          <div class="meta">تاريخ الطباعة: ${new Date().toLocaleDateString("ar-DZ")} - عدد السجلات: ${paginatedData.length}</div>
          <table>
            <thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
            <tbody>
              ${rows.map(r => `<tr>${r.map(v => `<td>${v}</td>`).join("")}</tr>`).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 500);
  }, [paginatedData, columns]);

  if (loading) {
    return (
      <div className={cn("overflow-hidden rounded-xl border border-border bg-surface shadow", className)}>
        <div style={{ maxHeight: maxHeight }} className="overflow-auto">
          <table className="w-full" role="grid">
            <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-surface/95 backdrop-blur-sm")}>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{ width: col.width, textAlign: col.align || "right" }} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted border-b border-border">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border/50">
                  {columns.map(() => <td key={Math.random()} className="px-4 py-4"><div className="h-4 w-3/4 bg-muted animate-pulse rounded" /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Check if any column has filter
  const hasFilters = columns.some(c => c.filterable);
  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className={cn("rounded-xl border border-border bg-surface shadow", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder || t("searchPlaceholder")}
                className="w-64 rounded-lg border-[1.5px] border-border bg-bg px-10 py-2 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-[rgba(5,150,105,0.1)]"
              />
            </div>
          )}

          {hasFilters && activeFiltersCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-2.5 py-1 text-xs font-medium text-accent">
              <Filter className="h-3 w-3" />
              {activeFiltersCount} {t("activeFilters")}
              <button onClick={() => setFilters({})} className="ml-1 text-accent hover:text-accent/70">×</button>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {exportable && (
            <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-fg transition hover:border-accent hover:text-accent" title={t("exportCSV")}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t("export")}</span>
            </button>
          )}
          {printable && (
            <button onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-fg transition hover:border-accent hover:text-accent" title={t("print")}>
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">{t("print")}</span>
            </button>
          )}

          {selection?.enabled && selectedCount > 0 && selection.bulkActions && (
            <div className="flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/5 px-3 py-1.5">
              <span className="text-sm font-medium text-warning">{selectedCount} {t("selected")}</span>
              {selection.bulkActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => {
                    const selectedData = paginatedData.filter(row => selectedRows.has(keyExtractor(row)));
                    if (action.confirmMessage && !window.confirm(action.confirmMessage)) return;
                    action.action(selectedData);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition",
                    action.variant === "danger"
                      ? "text-danger hover:bg-danger/10"
                      : "text-fg hover:bg-bg"
                  )}
                >
                  {action.icon}
                  <span className="hidden sm:inline">{action.label}</span>
                </button>
              ))}
              <button onClick={() => handleSelectAll(false)} className="ml-1 rounded-md p-1 text-muted hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {pagination?.enabled && totalPages > 1 && (
            <div className="flex items-center gap-1 ml-auto">
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="rounded-lg border border-border bg-surface px-2 py-1 text-sm outline-none"
              >
                {pagination.pageSizeOptions?.map(opt => <option key={opt} value={opt}>{opt} {t("perPage")}</option>) || [10, 20, 50, 100].map(opt => <option key={opt} value={opt}>{opt} {t("perPage")}</option>)}
              </select>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded-md p-1.5 text-muted hover:text-fg disabled:opacity-40" aria-label={t("previousPage")}><ChevronRight className="h-5 w-5" /></button>
              <span className="px-2 text-sm font-medium">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded-md p-1.5 text-muted hover:text-fg disabled:opacity-40" aria-label={t("nextPage")}><ChevronLeft className="h-5 w-5" /></button>
            </div>
          )}
        </div>
      </div>

      {/* Column Filters Row */}
      {hasFilters && (
        <div className="border-b border-border px-4 py-2 bg-bg/50">
          <div className="flex flex-wrap gap-2">
            {columns.filter(c => c.filterable).map(col => (
              <div key={col.key} className="relative min-w-[140px] flex-1">
                {col.filterOptions ? (
                  <select
                    value={filters[col.key] || ""}
                    onChange={e => handleFilter(col.key, e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    <option value="">{t("all")}</option>
                    {col.filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={filters[col.key] || ""}
                    onChange={e => handleFilter(col.key, e.target.value)}
                    placeholder={t("filterBy", { column: col.header })}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-accent"
                  />
                )}
              </div>
            ))}
        </div>
      </div>
      )}


      {/* Table */}
      <div style={{ maxHeight }} className="overflow-auto">
        <table className="w-full" role="grid">
          <thead className={cn(stickyHeader && "sticky top-0 z-10 bg-surface/95 backdrop-blur-sm")}>
            <tr className="border-b border-border">
              {selection?.enabled && (
                <th className="w-12 px-3 py-3 text-center border-e border-border">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = indeterminate; }}
                    onChange={e => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                    aria-label={t("selectAll")}
                  />
                </th>
              )}
              {columns.map((col, colIndex) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align || "right", position: col.sticky ? "sticky" : undefined, right: col.sticky ? 0 : undefined }}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted border-b border-border",
                    col.sortable && "cursor-pointer select-none hover:text-fg",
                    col.align === "center" && "text-center",
                    col.align === "left" && "text-left"
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{col.header}</span>
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === "asc" ? <ChevronUp className="h-3.5 w-3.5 text-accent" /> : <ChevronDown className="h-3.5 w-3.5 text-accent" />
                    )}
                    {col.sortable && !sortConfig?.key?.includes(col.key) && (
                      <ArrowUpDown className="h-3.5 w-3.5 text-muted/50" />
                    )}
                    {col.filterable && (
                      <button
                        onClick={e => { e.stopPropagation(); setShowColumnMenu(col.key); setColumnMenuAnchor(e.currentTarget); }}
                        className={cn("p-1 rounded hover:bg-bg", filters[col.key] && "text-accent")}
                        aria-label={t("filterColumn", { column: col.header })}
                      >
                        <Filter className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {col.filterable && filters[col.key] && (
                      <button onClick={e => { e.stopPropagation(); handleFilter(col.key, ""); }} className="ml-1 p-0.5 text-muted hover:text-danger" aria-label={t("clearFilter")}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {rowActions && rowActions.length > 0 && (
                <th className="w-20 px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted border-b border-border">{t("actions")}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selection?.enabled ? 1 : 0) + (rowActions ? 1 : 0)} className="px-4 py-12 text-center">
                  {loading ? (
                    <div className="flex flex-col items-center gap-3 text-muted">
                      <Loader2 className="h-8 w-8 animate-spin text-accent" />
                      <span>{t("loading")}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <FileText className="h-12 w-12 text-muted/30" />
                      <p className="text-muted">{emptyMessage || t("noData")}</p>
                      {emptyAction}
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIndex) => {
                const rowId = keyExtractor(row);
                const rowSelected = isRowSelected(rowId);

                return (
                  <tr
                    key={rowId}
                    className={cn(
                      "border-b border-border/50 transition-colors",
                      rowSelected && "bg-accent/5",
                      rowClick && "cursor-pointer hover:bg-bg/50"
                    )}
                    onClick={e => {
                      const target = e.target as HTMLElement;
                      if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement || target.closest("button, a, label, input")) return;
                      if (!rowClick) return;
                      rowClick(row);
                    }}
                    onDoubleClick={e => { if (!rowClick) return; rowClick(row); }}
                    aria-selected={rowSelected}
                  >
                    {selection?.enabled && (
                      <td className="w-12 px-3 py-3 text-center border-e border-border/50">
                        <input
                          type="checkbox"
                          checked={rowSelected}
                          onChange={e => handleRowSelect(rowId, e.target.checked)}
                          onClick={e => e.stopPropagation()}
                          className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                          aria-label={t("selectRow", { id: rowId })}
                        />
                      </td>
                    )}
                    {columns.map(col => (
                      <td
                        key={col.key}
                        style={{ textAlign: col.align || "right" }}
                        className="px-4 py-3 text-sm"
                      >
                        {col.render ? col.render(row, rowIndex) : row[col.key] != null ? String(row[col.key]) : <span className="text-muted">—</span>}
                      </td>
            ))}
                    {rowActions && rowActions.length > 0 && (
                      <td className="px-2 py-2 text-center">
                        <div className="inline-flex items-center justify-center gap-1">
                          {rowActions.map((action, i) => {
                            if (action.condition && !action.condition(row)) return null;
                            return (
                              <button
                                key={i}
                                onClick={e => { e.stopPropagation(); action.action(row); }}
                                className={cn(
                                  "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                                  action.variant === "danger" ? "text-danger hover:bg-danger/10" :
                                  action.variant === "ghost" ? "text-muted hover:bg-bg hover:text-fg" :
                                  "text-muted hover:bg-bg hover:text-fg"
                                )}
                                title={action.tooltip || action.label}
                                aria-label={action.label}
                              >
                                {action.icon}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              )}
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      {pagination?.enabled && filteredData.length > 0 && (
        <div className="border-t border-border px-4 py-3 flex items-center justify-between text-sm text-muted">
          <span>{t("showing", { start: (currentPage - 1) * pageSize + 1, end: Math.min(currentPage * pageSize, filteredData.length), total: filteredData.length })}</span>
          <div className="flex items-center gap-2">
            <span>{t("page")} {currentPage} {t("of")} {totalPages}</span>
          </div>
        </div>
      )}

      {/* Column Filter Dropdown */}
      {showColumnMenu && columnMenuAnchor && (
        <div
          className="fixed z-50 rounded-lg border border-border bg-surface shadow-lg min-w-[180px] py-1"
          style={{
            top: columnMenuAnchor.getBoundingClientRect().bottom + 4,
            left: columnMenuAnchor.getBoundingClientRect().left - 160,
          }}
        >
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("filterBy")}</div>
          {columns.filter(c => c.filterable && c.filterOptions).map(col => (
            <div key={col.key} className="border-t border-border/50">
              <div className="px-3 py-1.5 text-xs font-medium text-muted">{col.header}</div>
              <select
                value={filters[col.key] || ""}
                onChange={e => { handleFilter(col.key, e.target.value); setShowColumnMenu(null); }}
                className="w-full px-3 py-2 text-sm border-none outline-none focus:bg-bg"
              >
                <option value="">{t("all")}</option>
                {col.filterOptions!.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          ))}
          <div className="p-2 border-t border-border/50">
            <button onClick={() => { Object.keys(filters).forEach(k => handleFilter(k, "")); setShowColumnMenu(null); }} className="text-sm text-danger hover:underline w-full text-left px-3 py-1">{t("clearAllFilters")}</button>
          </div>
        </div>
      )}
    </div>
  </div>
  );
}

// Mobile Card View
export function DataTableMobileCard<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  renderCard,
  emptyMessage,
}: {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  renderCard: (row: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted/30" />
        <p className="text-muted">{emptyMessage || "لا توجد بيانات"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 md:hidden">
      {data.map((row, index) => (
        <div key={keyExtractor(row)} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          {renderCard(row, index)}
        </div>
      ))}
    </div>
  );
}