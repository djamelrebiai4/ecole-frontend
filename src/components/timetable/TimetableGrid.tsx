"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Minus, Plus, Printer } from "lucide-react";
import type { ScheduleSlot, ScheduleBreak } from "@/types/timetable";

const DAY_NAMES = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
const HOUR_START = 8;
const HOUR_END = 18;
const STEP_MIN = 30;

const ZOOM_LEVELS = [
  { key: "S", cellW: 60, cellH: 36 },
  { key: "M", cellW: 80, cellH: 48 },
  { key: "L", cellW: 100, cellH: 60 },
  { key: "XL", cellW: 120, cellH: 72 },
] as const;

interface TimetableGridProps {
  slots: ScheduleSlot[];
  breaks: ScheduleBreak[];
  roomName?: string;
  onSelectRange?: (dayOfWeek: number, startTime: string, endTime: string) => void;
  onSlotClick?: (slot: ScheduleSlot) => void;
  onResizeSlot?: (id: string, startTime: string, endTime: string) => void;
  readOnly?: boolean;
}

function timeToMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function minToTime(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function deriveColor(id: string, color?: string | null) {
  if (color) return color;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const palette = [
    "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981",
    "#06b6d4", "#ec4899", "#f97316", "#6366f1", "#14b8a6",
  ];
  return palette[Math.abs(hash) % palette.length];
}

const totalSteps = ((HOUR_END - HOUR_START) * 60) / STEP_MIN;

export function TimetableGrid({ slots, breaks, roomName, onSelectRange, onSlotClick, onResizeSlot, readOnly }: TimetableGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [zoomIdx, setZoomIdx] = useState(1);
  const cellW = ZOOM_LEVELS[zoomIdx].cellW;
  const cellH = ZOOM_LEVELS[zoomIdx].cellH;
  const labelW = 90;
  const headerH = 44;

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ day: number; col: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ day: number; col: number } | null>(null);

  const [resizeState, setResizeState] = useState<{
    slotId: string;
    edge: "start" | "end";
    day: number;
    origStart: number;
    origEnd: number;
    currCol: number;
  } | null>(null);

  const gridW = labelW + totalSteps * cellW;
  const gridH = headerH + 7 * cellH;

  const timeLabels: string[] = [];
  for (let m = HOUR_START * 60; m < HOUR_END * 60; m += STEP_MIN) {
    timeLabels.push(minToTime(m));
  }

  const slotMap = new Map<number, ScheduleSlot[]>();
  for (const s of slots) {
    const existing = slotMap.get(s.day_of_week) || [];
    existing.push(s);
    slotMap.set(s.day_of_week, existing);
  }

  const slotPositions = new Map<string, { day: number; colStart: number; colSpan: number }>();
  for (const s of slots) {
    const ss = timeToMin(s.start_time);
    const se = timeToMin(s.end_time);
    slotPositions.set(s.id, {
      day: s.day_of_week,
      colStart: (ss - HOUR_START * 60) / STEP_MIN,
      colSpan: (se - ss) / STEP_MIN,
    });
  }

  const breakMap = new Map<number, ScheduleBreak[]>();
  for (const b of breaks) {
    const existing = breakMap.get(b.day_of_week) || [];
    existing.push(b);
    breakMap.set(b.day_of_week, existing);
  }

  function getCellCoord(clientX: number, clientY: number) {
    if (!gridRef.current) return null;
    const rect = gridRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const col = Math.floor((x - labelW) / cellW);
    const day = Math.floor((y - headerH) / cellH);
    if (col < 0 || col >= totalSteps || day < 0 || day >= 7) return null;
    return { day, col };
  }

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (readOnly) return;
    const coord = getCellCoord(e.clientX, e.clientY);
    if (!coord) return;
    setIsDragging(true);
    setDragStart(coord);
    setDragEnd(coord);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [readOnly]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeState) {
      const coord = getCellCoord(e.clientX, e.clientY);
      if (!coord || coord.day !== resizeState.day) return;
      setResizeState((prev) => prev ? { ...prev, currCol: coord.col } : null);
      return;
    }
    if (!isDragging) return;
    const coord = getCellCoord(e.clientX, e.clientY);
    if (!coord) return;
    setDragEnd(coord);
  }, [isDragging, resizeState]);

  const handlePointerUp = useCallback(() => {
    if (resizeState) {
      const { slotId, edge, origStart, origEnd, currCol } = resizeState;
      const newStart = edge === "start"
        ? Math.min(origEnd - STEP_MIN, HOUR_START * 60 + currCol * STEP_MIN)
        : origStart;
      const newEnd = edge === "end"
        ? Math.max(origStart + STEP_MIN, HOUR_START * 60 + (currCol + 1) * STEP_MIN)
        : origEnd;
      if (newStart !== origStart || newEnd !== origEnd) {
        onResizeSlot?.(slotId, minToTime(newStart), minToTime(newEnd));
      }
      setResizeState(null);
      return;
    }

    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    if (dragStart.day !== dragEnd.day) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    const minCol = Math.min(dragStart.col, dragEnd.col);
    const maxCol = Math.max(dragStart.col, dragEnd.col);
    const startMin = HOUR_START * 60 + minCol * STEP_MIN;
    const endMin = HOUR_START * 60 + (maxCol + 1) * STEP_MIN;
    onSelectRange?.(dragStart.day, minToTime(startMin), minToTime(endMin));
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  }, [isDragging, dragStart, dragEnd, onSelectRange, resizeState, onResizeSlot]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const abort = new AbortController();
    el.addEventListener("pointerleave", () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }
      if (resizeState) {
        setResizeState(null);
      }
    }, { signal: abort.signal });
    return () => abort.abort();
  }, [isDragging, resizeState]);

  function isCellBooked(day: number, col: number) {
    const cellStart = HOUR_START * 60 + col * STEP_MIN;
    const cellEnd = cellStart + STEP_MIN;
    const daySlots = slotMap.get(day) || [];
    return daySlots.some((s) => {
      const ss = timeToMin(s.start_time);
      const se = timeToMin(s.end_time);
      return cellStart < se && cellEnd > ss;
    });
  }

  function isCellBreak(day: number, col: number) {
    const cellStart = HOUR_START * 60 + col * STEP_MIN;
    const cellEnd = cellStart + STEP_MIN;
    const dayBreaks = breakMap.get(day) || [];
    return dayBreaks.some((b) => {
      const bs = timeToMin(b.start_time);
      const be = timeToMin(b.end_time);
      return cellStart < be && cellEnd > bs;
    });
  }

  function isCellSelected(day: number, col: number) {
    if (!isDragging || !dragStart || !dragEnd) return false;
    if (dragStart.day !== day || dragEnd.day !== day) return false;
    const minCol = Math.min(dragStart.col, dragEnd.col);
    const maxCol = Math.max(dragStart.col, dragEnd.col);
    return col >= minCol && col <= maxCol;
  }

  const selectionWidth = dragStart && dragEnd
    ? (Math.abs(dragEnd.col - dragStart.col) + 1) * cellW : 0;
  const selectionLeft = dragStart && dragEnd
    ? labelW + Math.min(dragStart.col, dragEnd.col) * cellW : 0;
  const selectionTop = dragStart && dragEnd
    ? headerH + dragStart.day * cellH : 0;

  function handleResizePointerDown(e: React.PointerEvent, slot: ScheduleSlot, edge: "start" | "end") {
    e.stopPropagation();
    if (readOnly) return;
    const ss = timeToMin(slot.start_time);
    const se = timeToMin(slot.end_time);
    const coord = getCellCoord(e.clientX, e.clientY);
    if (!coord) return;
    setResizeState({
      slotId: slot.id,
      edge,
      day: slot.day_of_week,
      origStart: ss,
      origEnd: se,
      currCol: edge === "start" ? (ss - HOUR_START * 60) / STEP_MIN : (se - HOUR_START * 60) / STEP_MIN - 1,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePrint() {
    const printContent = document.querySelector(".timetable-print-area");
    if (!printContent) return;
    const original = document.title;
    document.title = roomName ? `جدول القاعة: ${roomName}` : "جدول القاعات";
    window.print();
    document.title = original;
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1 shadow-[var(--shadow)]">
          <button
            onClick={() => setZoomIdx((i) => Math.max(0, i - 1))}
            disabled={zoomIdx === 0}
            className="rounded-md p-1.5 text-muted transition hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
            title="تصغير"
          >
            <Minus className="h-4 w-4" />
          </button>
          {ZOOM_LEVELS.map((z, i) => (
            <button
              key={z.key}
              onClick={() => setZoomIdx(i)}
              className={`min-w-[28px] rounded-md px-2 py-1 text-xs font-bold transition ${
                i === zoomIdx
                  ? "bg-accent text-white"
                  : "text-muted hover:bg-bg hover:text-fg"
              }`}
            >
              {z.key}
            </button>
          ))}
          <button
            onClick={() => setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1))}
            disabled={zoomIdx === ZOOM_LEVELS.length - 1}
            className="rounded-md p-1.5 text-muted transition hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-30"
            title="تكبير"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-muted transition hover:bg-bg hover:text-fg"
          title="طباعة"
        >
          <Printer className="h-4 w-4" />
          طباعة
        </button>
      </div>

      {/* Grid */}
      <div className="timetable-print-area overflow-auto rounded-xl border border-border bg-surface shadow-[var(--shadow)]" dir="ltr">
        <div
          ref={gridRef}
          style={{
            width: gridW,
            height: gridH,
            position: "relative",
            userSelect: "none",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Time headers */}
          <div style={{ position: "absolute", top: 0, left: labelW, height: headerH, display: "flex" }}>
            {timeLabels.map((t, i) => (
              <div
                key={i}
                style={{
                  width: cellW,
                  height: headerH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--muted)",
                  borderLeft: "1px solid var(--border)",
                  borderBottom: "2px solid var(--border)",
                }}
              >
                {t}
              </div>
            ))}
          </div>

          {/* Day labels */}
          {DAY_NAMES.map((name, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: headerH + i * cellH,
                left: 0,
                width: labelW,
                height: cellH,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 700,
                color: "var(--fg)",
                borderBottom: "1px solid var(--border)",
                borderLeft: "1px solid var(--border)",
              }}
            >
              {name}
            </div>
          ))}

          {/* Grid cells background */}
          {Array.from({ length: 7 }).map((_, day) =>
            Array.from({ length: totalSteps }).map((_, col) => {
              const booked = isCellBooked(day, col);
              const isBreak = isCellBreak(day, col);
              const selected = isCellSelected(day, col);
              let bg = "var(--bg)";
              if (isBreak) bg = "var(--icon-bg-warning)";
              else if (booked) bg = "transparent";
              else if (selected) bg = "rgba(5, 150, 105, 0.12)";
              return (
                <div
                  key={`${day}-${col}`}
                  style={{
                    position: "absolute",
                    top: headerH + day * cellH,
                    left: labelW + col * cellW,
                    width: cellW,
                    height: cellH,
                    background: bg,
                    borderRight: "1px solid var(--border)",
                    borderBottom: "1px solid var(--border)",
                    cursor: readOnly ? "default" : isBreak ? "not-allowed" : "pointer",
                  }}
                />
              );
            })
          )}

          {/* Break labels */}
          {breaks.map((b) => {
            const bs = timeToMin(b.start_time);
            const be = timeToMin(b.end_time);
            const startCol = (bs - HOUR_START * 60) / STEP_MIN;
            const span = (be - bs) / STEP_MIN;
            return (
              <div
                key={b.id}
                style={{
                  position: "absolute",
                  top: headerH + b.day_of_week * cellH,
                  left: labelW + startCol * cellW,
                  width: span * cellW,
                  height: cellH,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  fontWeight: 600,
                  color: "var(--muted)",
                  zIndex: 2,
                }}
              >
                {b.name}
              </div>
            );
          })}

          {/* Booked slot overlays */}
          {slots.map((s) => {
            const ss = timeToMin(s.start_time);
            const se = timeToMin(s.end_time);
            const startCol = (ss - HOUR_START * 60) / STEP_MIN;
            const span = (se - ss) / STEP_MIN;
            const color = deriveColor(s.id, s.color);
            const isResizing = resizeState?.slotId === s.id;

            let previewLeft: number | null = null;
            let previewWidth: number | null = null;
            if (isResizing && resizeState) {
              const newStart = resizeState.edge === "start"
                ? Math.min(resizeState.origEnd - STEP_MIN, HOUR_START * 60 + resizeState.currCol * STEP_MIN)
                : resizeState.origStart;
              const newEnd = resizeState.edge === "end"
                ? Math.max(resizeState.origStart + STEP_MIN, HOUR_START * 60 + (resizeState.currCol + 1) * STEP_MIN)
                : resizeState.origEnd;
              const previewCol = (newStart - HOUR_START * 60) / STEP_MIN;
              const previewSpan = (newEnd - newStart) / STEP_MIN;
              previewLeft = labelW + previewCol * cellW + 2;
              previewWidth = previewSpan * cellW - 4;
            }

            return (
              <div key={s.id}>
                {/* Original slot (or invisible during resize) */}
                <div
                  style={{
                    position: "absolute",
                    top: headerH + s.day_of_week * cellH + 2,
                    left: isResizing && previewLeft !== null ? previewLeft : labelW + startCol * cellW + 2,
                    width: isResizing && previewWidth !== null ? previewWidth : span * cellW - 4,
                    height: cellH - 4,
                    borderRadius: 6,
                    background: isResizing ? `${color}80` : color,
                    opacity: isResizing ? 0.5 : 0.9,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: Math.max(9, Math.round(11 * (cellW / 80))),
                    fontWeight: 600,
                    color: "#fff",
                    cursor: readOnly ? "default" : "pointer",
                    zIndex: 3,
                    overflow: "hidden",
                    transition: isResizing ? "none" : "opacity 0.15s",
                    outline: isResizing ? "2px dashed #fff" : undefined,
                    outlineOffset: -2,
                  }}
                  onClick={(e) => {
                    if (isResizing) return;
                    e.stopPropagation();
                    onSlotClick?.(s);
                  }}
                >
                  <span style={{ lineHeight: 1.2, textAlign: "center", padding: "0 4px" }}>
                    {s.class?.name || ""}
                  </span>
                  {s.subject && (
                    <span style={{ fontSize: Math.max(8, Math.round(10 * (cellW / 80))), opacity: 0.85, lineHeight: 1.2 }}>
                      {s.subject}
                    </span>
                  )}
                </div>

                {/* Resize handles */}
                {!readOnly && (
                  <>
                    <div
                      style={{
                        position: "absolute",
                        top: headerH + s.day_of_week * cellH + 2,
                        left: labelW + startCol * cellW,
                        width: 10,
                        height: cellH - 4,
                        cursor: "col-resize",
                        zIndex: 4,
                      }}
                      onPointerDown={(e) => handleResizePointerDown(e, s, "start")}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: headerH + s.day_of_week * cellH + 2,
                        left: labelW + (startCol + span) * cellW - 10,
                        width: 10,
                        height: cellH - 4,
                        cursor: "col-resize",
                        zIndex: 4,
                      }}
                      onPointerDown={(e) => handleResizePointerDown(e, s, "end")}
                    />
                  </>
                )}
              </div>
            );
          })}

          {/* Selection drag overlay */}
          {isDragging && dragStart && dragEnd && dragStart.day === dragEnd.day && (
            <div
              style={{
                position: "absolute",
                top: selectionTop,
                left: selectionLeft,
                width: selectionWidth,
                height: cellH,
                background: "rgba(5, 150, 105, 0.2)",
                border: "2px dashed var(--accent)",
                borderRadius: 4,
                zIndex: 5,
                pointerEvents: "none",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
