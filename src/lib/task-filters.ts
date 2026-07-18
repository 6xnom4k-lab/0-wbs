import type { UnifiedTask } from "@/types/unified-task";
import type { WbsTaskStatus } from "@/types/wbs";

export type TaskQuickFilter =
  | "all"
  | "my_pending"
  | "not_started"
  | "in_progress"
  | "done"
  | "on_hold"
  | "overdue";

export function isTaskOverdue(task: UnifiedTask): boolean {
  if (task.status === "done" || !task.endDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(`${task.endDate}T00:00:00`);
  return end < today;
}

export function isMyPendingTask(task: UnifiedTask, myAssigneeName: string): boolean {
  if (!myAssigneeName.trim()) {
    return false;
  }

  return task.assignee.trim() === myAssigneeName.trim() && task.status !== "done";
}

export function filterUnifiedTasks(
  tasks: UnifiedTask[],
  options: {
    query?: string;
    assignee?: string;
    status?: WbsTaskStatus | "all";
    quickFilter?: TaskQuickFilter;
    myAssigneeName?: string;
  },
): UnifiedTask[] {
  return tasks.filter((task) => {
    if (options.quickFilter && options.quickFilter !== "all") {
      if (options.quickFilter === "my_pending") {
        if (!isMyPendingTask(task, options.myAssigneeName ?? "")) {
          return false;
        }
      } else if (options.quickFilter === "overdue") {
        if (!isTaskOverdue(task)) {
          return false;
        }
      } else if (task.status !== options.quickFilter) {
        return false;
      }
    }

    if (options.assignee && options.assignee !== "all") {
      const taskAssignee = task.assignee.trim() || "未割当";
      if (taskAssignee !== options.assignee) {
        return false;
      }
    }

    if (options.status && options.status !== "all" && task.status !== options.status) {
      return false;
    }

    return matchesUnifiedTaskQuery(task, options.query ?? "");
  });
}

export function matchesUnifiedTaskQuery(task: UnifiedTask, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [task.category, task.title, task.detail, task.assignee, task.wbsLabel]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function groupTasksByAssignee(
  tasks: UnifiedTask[],
): Array<{ assignee: string; tasks: UnifiedTask[] }> {
  const groups = new Map<string, UnifiedTask[]>();

  for (const task of tasks) {
    const assignee = task.assignee.trim() || "未割当";
    const bucket = groups.get(assignee) ?? [];
    bucket.push(task);
    groups.set(assignee, bucket);
  }

  return listAssigneeNames(tasks).map((assignee) => ({
    assignee,
    tasks: groups.get(assignee) ?? [],
  }));
}

export function listAssigneeNames(tasks: UnifiedTask[]): string[] {
  const names = new Set<string>();

  for (const task of tasks) {
    names.add(task.assignee.trim() || "未割当");
  }

  return [...names].sort((left, right) => {
    if (left === "未割当") {
      return 1;
    }

    if (right === "未割当") {
      return -1;
    }

    return left.localeCompare(right, "ja");
  });
}

export function countMyPendingTasks(tasks: UnifiedTask[], myAssigneeName: string): number {
  if (!myAssigneeName.trim()) {
    return 0;
  }

  return tasks.filter((task) => isMyPendingTask(task, myAssigneeName)).length;
}
