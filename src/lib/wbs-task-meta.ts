import type { WbsNode, WbsTaskStatus } from "@/types/wbs";

export const WBS_STATUS_OPTIONS: { value: WbsTaskStatus; label: string }[] = [
  { value: "not_started", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
  { value: "on_hold", label: "保留" },
];

export function getWbsStatusLabel(status: WbsTaskStatus | undefined): string {
  return WBS_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? "未着手";
}

export function getWbsStatusColor(status: WbsTaskStatus | undefined): string {
  switch (status) {
    case "done":
      return "bg-sky-500/80 ring-sky-400/40";
    case "in_progress":
      return "bg-emerald-500/80 ring-emerald-400/40";
    case "on_hold":
      return "bg-amber-500/75 ring-amber-400/40";
    default:
      return "bg-zinc-600/70 ring-zinc-500/30";
  }
}

export function getWbsStatusTextColor(status: WbsTaskStatus | undefined): string {
  switch (status) {
    case "done":
      return "text-sky-100";
    case "in_progress":
      return "text-emerald-100";
    case "on_hold":
      return "text-amber-100";
    default:
      return "text-zinc-300";
  }
}

export function normalizeWbsStatus(status: WbsTaskStatus | undefined): WbsTaskStatus {
  return status ?? "not_started";
}

export function parseISODate(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatShortDate(value: string | undefined): string {
  const date = parseISODate(value);
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function formatTableDate(value: string | undefined): string {
  const date = parseISODate(value);
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}/${month}/${day}`;
}

export function formatEffort(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return "";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function formatDateRange(startDate?: string, endDate?: string): string {
  const start = formatShortDate(startDate);
  const end = formatShortDate(endDate);

  if (start && end) {
    return `${start} 〜 ${end}`;
  }

  if (end) {
    return `〜 ${end}`;
  }

  if (start) {
    return `${start} 〜`;
  }

  return "";
}

export function collectWbsScheduleDates(root: WbsNode): Date[] {
  const dates: Date[] = [];

  function walk(node: WbsNode) {
    const start = parseISODate(node.startDate);
    const end = parseISODate(node.endDate);

    if (start) {
      dates.push(start);
    }

    if (end) {
      dates.push(end);
    }

    for (const child of node.children) {
      walk(child);
    }
  }

  for (const child of root.children) {
    walk(child);
  }

  return dates;
}

export function hasTaskMeta(node: WbsNode): boolean {
  return Boolean(
    (node.description ?? "").trim() ||
      (node.notes ?? "").trim() ||
      (node.content ?? "").trim() ||
      (node.links ?? []).some((link) => link.url.trim() || link.title.trim()) ||
      (node.assignee ?? "").trim() ||
      node.startDate ||
      node.endDate ||
      node.effort !== undefined ||
      (node.status && node.status !== "not_started"),
  );
}
