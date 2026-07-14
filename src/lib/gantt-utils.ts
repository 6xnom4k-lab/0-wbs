import { formatDateRange, collectWbsScheduleDates, parseISODate } from "@/lib/wbs-task-meta";
import type { WbsNode, WbsTaskStatus } from "@/types/wbs";

export const GANTT_DAY_COLUMN_WIDTH = 36;
export const GANTT_HEADER_HEIGHT = 54;
export const GANTT_ROW_HEIGHT = 40;

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

export type GanttMonthSpan = {
  key: string;
  label: string;
  spanDays: number;
};

export type GanttDayColumn = {
  key: string;
  date: Date;
  dayLabel: string;
  weekdayLabel: string;
  isWeekend: boolean;
  isToday: boolean;
  isMonthStart: boolean;
};

export type GanttTimeline = {
  rangeStart: Date;
  rangeEnd: Date;
  totalDays: number;
  days: GanttDayColumn[];
  monthSpans: GanttMonthSpan[];
  chartWidthPx: number;
};

export type GanttBarRender = {
  leftPx: number;
  widthPx: number;
  progressPercent: number;
  hasSchedule: boolean;
  title: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_RANGE_DAYS = 42;
const TIMELINE_PADDING_DAYS = 7;

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

function dayDiff(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

function formatMonthLabel(date: Date): string {
  return String(date.getMonth() + 1);
}

function buildMonthSpans(days: GanttDayColumn[]): GanttMonthSpan[] {
  const spans: GanttMonthSpan[] = [];
  let index = 0;

  while (index < days.length) {
    const current = days[index];
    const month = current.date.getMonth();
    const year = current.date.getFullYear();
    let spanDays = 0;

    while (
      index + spanDays < days.length &&
      days[index + spanDays].date.getMonth() === month &&
      days[index + spanDays].date.getFullYear() === year
    ) {
      spanDays += 1;
    }

    spans.push({
      key: `${year}-${month}-${index}`,
      label: formatMonthLabel(current.date),
      spanDays,
    });

    index += spanDays;
  }

  return spans;
}

export function getProgressPercent(status: WbsTaskStatus | undefined): number {
  switch (status) {
    case "done":
      return 100;
    case "in_progress":
      return 55;
    case "on_hold":
      return 25;
    default:
      return 0;
  }
}

export function getDescendantScheduleRange(node: WbsNode): {
  startDate?: string;
  endDate?: string;
} {
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  function walk(current: WbsNode) {
    const start = parseISODate(current.startDate);
    const end = parseISODate(current.endDate);

    if (start && (!minStart || start.getTime() < minStart.getTime())) {
      minStart = start;
    }

    if (end && (!maxEnd || end.getTime() > maxEnd.getTime())) {
      maxEnd = end;
    }

    for (const child of current.children) {
      walk(child);
    }
  }

  for (const child of node.children) {
    walk(child);
  }

  if (!minStart && !maxEnd) {
    return {};
  }

  const format = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: minStart ? format(minStart) : undefined,
    endDate: maxEnd ? format(maxEnd) : undefined,
  };
}

export function buildGanttTimeline(root: WbsNode): GanttTimeline {
  const today = startOfDay(new Date());
  const scheduledDates = collectWbsScheduleDates(root);

  let rangeStart = today;
  let rangeEnd = addDays(today, DEFAULT_RANGE_DAYS);

  if (scheduledDates.length > 0) {
    const minTime = Math.min(today.getTime(), ...scheduledDates.map((date) => date.getTime()));
    const maxTime = Math.max(...scheduledDates.map((date) => date.getTime()));
    rangeStart = addDays(new Date(minTime), -TIMELINE_PADDING_DAYS);
    rangeEnd = addDays(new Date(maxTime), TIMELINE_PADDING_DAYS);
  }

  if (rangeEnd.getTime() - rangeStart.getTime() < 14 * DAY_MS) {
    rangeEnd = addDays(rangeStart, 14);
  }

  const days: GanttDayColumn[] = [];
  let cursor = rangeStart;
  let previousMonth = -1;

  while (cursor.getTime() <= rangeEnd.getTime()) {
    const month = cursor.getMonth();
    const isMonthStart = month !== previousMonth;
    previousMonth = month;

    days.push({
      key: cursor.toISOString(),
      date: cursor,
      dayLabel: String(cursor.getDate()),
      weekdayLabel: WEEKDAY_LABELS[cursor.getDay()],
      isWeekend: cursor.getDay() === 0 || cursor.getDay() === 6,
      isToday: cursor.getTime() === today.getTime(),
      isMonthStart,
    });

    cursor = addDays(cursor, 1);
  }

  const totalDays = days.length;

  return {
    rangeStart,
    rangeEnd,
    totalDays,
    days,
    monthSpans: buildMonthSpans(days),
    chartWidthPx: totalDays * GANTT_DAY_COLUMN_WIDTH,
  };
}

export function getGanttBarRender(
  startDate: string | undefined,
  endDate: string | undefined,
  status: WbsTaskStatus | undefined,
  timeline: GanttTimeline,
): GanttBarRender {
  const parsedStart = parseISODate(startDate);
  const parsedEnd = parseISODate(endDate);

  let taskStart = parsedStart;
  let taskEnd = parsedEnd;

  if (taskStart && !taskEnd) {
    taskEnd = taskStart;
  } else if (!taskStart && taskEnd) {
    taskStart = taskEnd;
  }

  if (!taskStart || !taskEnd) {
    return {
      leftPx: 0,
      widthPx: 0,
      progressPercent: getProgressPercent(status),
      hasSchedule: false,
      title: "",
    };
  }

  if (taskEnd.getTime() < taskStart.getTime()) {
    taskEnd = taskStart;
  }

  const title = formatDateRange(startDate, endDate);

  const startIndex = dayDiff(timeline.rangeStart, taskStart);
  const endIndex = dayDiff(timeline.rangeStart, taskEnd);

  if (endIndex < 0 || startIndex >= timeline.totalDays) {
    return {
      leftPx: 0,
      widthPx: 0,
      progressPercent: getProgressPercent(status),
      hasSchedule: true,
      title,
    };
  }

  const clampedStartIndex = Math.max(0, startIndex);
  const clampedEndIndex = Math.min(timeline.totalDays - 1, endIndex);
  const spanDays = clampedEndIndex - clampedStartIndex + 1;

  return {
    leftPx: clampedStartIndex * GANTT_DAY_COLUMN_WIDTH,
    widthPx: spanDays * GANTT_DAY_COLUMN_WIDTH,
    progressPercent: getProgressPercent(status),
    hasSchedule: true,
    title,
  };
}

/** @deprecated Use buildGanttTimeline instead */
export function getTimelineWeeks(): string[] {
  return buildGanttTimeline({
    id: "",
    code: "0",
    name: "",
    children: [],
  }).days.filter((day) => day.date.getDate() === 1 || day.key === buildGanttTimeline({
    id: "",
    code: "0",
    name: "",
    children: [],
  }).days[0]?.key).map((day) => day.dayLabel);
}

/** @deprecated Use getGanttBarRender instead */
export function getGanttBarStyle(index: number, depth: number): {
  left: string;
  width: string;
} {
  const startWeek = Math.min(5, index % 4 + depth);
  const durationWeeks = Math.max(1, 2.5 - depth * 0.4);
  const left = (startWeek / 6) * 100;
  const width = (durationWeeks / 6) * 100;

  return {
    left: `${left}%`,
    width: `${Math.min(width, 100 - left)}%`,
  };
}
