"use client";

import type { DragEvent } from "react";

import {
  GANTT_DAY_COLUMN_WIDTH,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  getDescendantScheduleRange,
  getGanttBarRender,
  type GanttBarRender,
  type GanttTimeline,
} from "@/lib/gantt-utils";
import type { WbsFlatRow } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";

function dayCellClass(day: GanttTimeline["days"][number], extra = ""): string {
  return [
    "shrink-0 border-r border-zinc-800/80 last:border-r-0",
    day.isWeekend ? "bg-zinc-900/65" : "bg-zinc-950/40",
    day.isToday ? "bg-amber-400/12" : "",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export function GanttCalendarHeader({ timeline }: { timeline: GanttTimeline }) {
  return (
    <div
      className="sticky top-0 z-10 shrink-0 border-b border-zinc-700 bg-zinc-900"
      style={{ width: timeline.chartWidthPx, height: GANTT_HEADER_HEIGHT }}
    >
      <div className="flex h-[18px] border-b border-zinc-800/80">
        {timeline.monthSpans.map((span) => (
          <div
            key={span.key}
            style={{ width: span.spanDays * GANTT_DAY_COLUMN_WIDTH }}
            className="shrink-0 border-r border-zinc-800/80 px-1 text-center text-[11px] font-medium leading-[18px] text-zinc-300 last:border-r-0"
          >
            {span.label}
          </div>
        ))}
      </div>

      <div className="flex h-[18px] border-b border-zinc-800/80">
        {timeline.days.map((day) => (
          <div
            key={`${day.key}-weekday`}
            style={{ width: GANTT_DAY_COLUMN_WIDTH }}
            className={`${dayCellClass(day)} px-0.5 text-center text-[10px] leading-[18px] ${
              day.isToday ? "font-semibold text-amber-200/90" : "text-zinc-500"
            }`}
          >
            {day.weekdayLabel}
          </div>
        ))}
      </div>

      <div className="flex h-[18px]">
        {timeline.days.map((day) => (
          <div
            key={`${day.key}-date`}
            style={{ width: GANTT_DAY_COLUMN_WIDTH }}
            className={`${dayCellClass(day)} px-0.5 text-center text-[10px] tabular-nums leading-[18px] ${
              day.isToday ? "font-semibold text-amber-100" : "text-zinc-400"
            }`}
          >
            {day.dayLabel}
          </div>
        ))}
      </div>
    </div>
  );
}

function GanttProgressBar({ bar }: { bar: GanttBarRender }) {
  const innerWidth = Math.max(bar.widthPx - 8, 8);

  return (
    <div
      className="absolute top-1/2 z-[2] -translate-y-1/2"
      style={{
        left: bar.leftPx + 4,
        width: innerWidth,
      }}
      title={bar.title}
    >
      <div className="relative h-4 overflow-hidden rounded-full bg-zinc-700/70 ring-1 ring-zinc-600/50">
        {bar.progressPercent >= 100 ? (
          <div className="absolute inset-0 rounded-full bg-emerald-500" />
        ) : bar.progressPercent > 0 ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-sky-500"
            style={{ width: `${bar.progressPercent}%` }}
          />
        ) : null}
      </div>
    </div>
  );
}

function GanttSummaryLine({ bar }: { bar: GanttBarRender }) {
  if (!bar.hasSchedule || bar.widthPx <= 0) {
    return null;
  }

  const innerWidth = Math.max(bar.widthPx - 8, 8);

  return (
    <div
      className="absolute top-1.5 z-[1]"
      style={{
        left: bar.leftPx + 4,
        width: innerWidth,
      }}
      title={`配下の期間: ${bar.title}`}
    >
      <div className="relative h-0.5 bg-sky-400/70">
        <div className="absolute -top-[3px] left-0 h-2 w-2 rounded-full bg-sky-400/80" />
        <div className="absolute -top-[3px] right-0 h-2 w-2 rounded-full bg-sky-400/80" />
      </div>
    </div>
  );
}

type GanttCalendarRowProps = {
  row: WbsFlatRow;
  node: WbsNode | null;
  timeline: GanttTimeline;
  bar: GanttBarRender;
  rowChromeClass: string;
  isDragging: boolean;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function GanttCalendarRow({
  row,
  node,
  timeline,
  bar,
  rowChromeClass,
  isDragging,
  onDragOver,
  onDrop,
}: GanttCalendarRowProps) {
  const childRange = node && row.hasChildren ? getDescendantScheduleRange(node) : {};
  const summaryBar = getGanttBarRender(
    childRange.startDate,
    childRange.endDate,
    row.status,
    timeline,
  );

  return (
    <div
      className={`relative shrink-0 border-b border-zinc-800 ${rowChromeClass} ${
        isDragging ? "opacity-40" : ""
      }`}
      style={{
        width: timeline.chartWidthPx,
        minHeight: GANTT_ROW_HEIGHT,
        backgroundColor: row.isRoot ? "rgb(9 9 11 / 0.5)" : "rgb(9 9 11 / 0.35)",
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="absolute inset-0 flex">
        {timeline.days.map((day) => (
          <div
            key={day.key}
            style={{ width: GANTT_DAY_COLUMN_WIDTH, height: GANTT_ROW_HEIGHT }}
            className={dayCellClass(day, "h-full")}
          />
        ))}
      </div>

      {row.hasChildren && summaryBar.hasSchedule && summaryBar.widthPx > 0 && (
        <GanttSummaryLine bar={summaryBar} />
      )}

      {bar.hasSchedule && bar.widthPx > 0 && <GanttProgressBar bar={bar} />}
    </div>
  );
}
