import { normalizeWbsStatus } from "@/lib/wbs-task-meta";
import type { UnifiedTask } from "@/types/unified-task";
import type { WbsNode, WbsTaskStatus } from "@/types/wbs";

export type ProgressItem = {
  status: WbsTaskStatus;
  progressPercent: number;
  endDate?: string;
};

export type ProgressStats = {
  total: number;
  done: number;
  inProgress: number;
  notStarted: number;
  onHold: number;
  overdue: number;
  averageProgress: number;
};

export function clampProgressPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getStatusDefaultProgress(status: WbsTaskStatus | undefined): number {
  switch (normalizeWbsStatus(status)) {
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

export function resolveProgressPercent(
  progressPercent: number | undefined,
  status: WbsTaskStatus | undefined,
): number {
  if (progressPercent !== undefined && !Number.isNaN(progressPercent)) {
    return clampProgressPercent(progressPercent);
  }

  return getStatusDefaultProgress(status);
}

export function computeNodeProgress(node: WbsNode): number {
  if (node.children.length > 0) {
    const childProgress = node.children.map(computeNodeProgress);
    if (childProgress.length === 0) {
      return 0;
    }

    return Math.round(childProgress.reduce((sum, value) => sum + value, 0) / childProgress.length);
  }

  return resolveProgressPercent(node.progressPercent, node.status);
}

export function syncStatusWithProgress(
  status: WbsTaskStatus,
  progressPercent: number,
): WbsTaskStatus {
  const normalized = normalizeWbsStatus(status);

  if (progressPercent >= 100) {
    return "done";
  }

  if (progressPercent <= 0) {
    return normalized === "done" ? "not_started" : normalized;
  }

  if (normalized === "not_started" || normalized === "done") {
    return "in_progress";
  }

  return normalized;
}

export function syncProgressWithStatus(
  status: WbsTaskStatus,
  currentProgress?: number,
): number | undefined {
  const normalized = normalizeWbsStatus(status);

  if (normalized === "done") {
    return 100;
  }

  if (normalized === "not_started") {
    return 0;
  }

  if (currentProgress === undefined) {
    return undefined;
  }

  const clamped = clampProgressPercent(currentProgress);
  if (normalized === "in_progress" && (clamped === 0 || clamped === 100)) {
    return getStatusDefaultProgress(normalized);
  }

  return clamped;
}

export function isTaskOverdue(endDate: string | undefined, status: WbsTaskStatus): boolean {
  if (!endDate || normalizeWbsStatus(status) === "done") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(end.getTime())) {
    return false;
  }

  return end.getTime() < today.getTime();
}

export function computeProgressStats(items: ProgressItem[]): ProgressStats {
  const stats: ProgressStats = {
    total: items.length,
    done: 0,
    inProgress: 0,
    notStarted: 0,
    onHold: 0,
    overdue: 0,
    averageProgress: 0,
  };

  if (items.length === 0) {
    return stats;
  }

  let progressSum = 0;

  for (const item of items) {
    const status = normalizeWbsStatus(item.status);
    progressSum += resolveProgressPercent(item.progressPercent, status);

    switch (status) {
      case "done":
        stats.done += 1;
        break;
      case "in_progress":
        stats.inProgress += 1;
        break;
      case "on_hold":
        stats.onHold += 1;
        break;
      default:
        stats.notStarted += 1;
        break;
    }

    if (isTaskOverdue(item.endDate, status)) {
      stats.overdue += 1;
    }
  }

  stats.averageProgress = Math.round(progressSum / items.length);
  return stats;
}

export function computeUnifiedProgressStats(tasks: UnifiedTask[]): ProgressStats {
  return computeProgressStats(
    tasks.map((task) => ({
      status: task.status,
      progressPercent: task.progressPercent,
      endDate: task.endDate,
    })),
  );
}

export function computeWbsBoardProgressStats(root: WbsNode): ProgressStats {
  const items: ProgressItem[] = [];

  function walk(node: WbsNode) {
    if (node.code === "0") {
      for (const child of node.children) {
        walk(child);
      }
      return;
    }

    if (node.children.length > 0) {
      for (const child of node.children) {
        walk(child);
      }
      return;
    }

    items.push({
      status: normalizeWbsStatus(node.status),
      progressPercent: resolveProgressPercent(node.progressPercent, node.status),
      endDate: node.endDate,
    });
  }

  walk(root);
  return computeProgressStats(items);
}
