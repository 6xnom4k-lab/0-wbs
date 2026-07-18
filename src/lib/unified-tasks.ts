import { findNodePath, flattenWbsBoard } from "@/lib/wbs";
import { normalizeWbsStatus } from "@/lib/wbs-task-meta";
import type { ProjectTask } from "@/types/task";
import type { UnifiedTask } from "@/types/unified-task";
import type { WbsNode, WbsProject } from "@/types/wbs";

export type WbsNodeOption = {
  id: string;
  label: string;
  depth: number;
};

export function formatWbsNodeLabel(root: WbsNode, nodeId: string): string {
  const path = findNodePath(root, nodeId);
  if (!path) {
    return "";
  }

  return path.map((node) => `${node.code} ${node.name}`).join(" / ");
}

export function getWbsTopCategory(root: WbsNode, nodeId: string): string {
  const path = findNodePath(root, nodeId);
  if (!path || path.length === 0) {
    return "";
  }

  return path[0]?.name ?? "";
}

export function listWbsNodeOptions(root: WbsNode): WbsNodeOption[] {
  return flattenWbsBoard(root).map((row) => ({
    id: row.id,
    label: `${"　".repeat(row.depth)}${row.code} ${row.name}`,
    depth: row.depth,
  }));
}

export function buildUnifiedTasks(
  project: WbsProject,
  manualTasks: ProjectTask[],
): UnifiedTask[] {
  const wbsTasks: UnifiedTask[] = flattenWbsBoard(project.root).map((row) => ({
    key: `wbs:${row.id}`,
    source: "wbs" as const,
    projectId: project.id,
    wbsNodeId: row.id,
    wbsLabel: formatWbsNodeLabel(project.root, row.id),
    category: getWbsTopCategory(project.root, row.id),
    title: row.name,
    detail: row.description ?? "",
    assignee: row.assignee ?? "",
    status: normalizeWbsStatus(row.status),
    priority: "medium" as const,
    startDate: row.startDate ?? "",
    endDate: row.endDate ?? "",
    scheduledAt: row.scheduledAt ?? "",
    scheduledEndAt: row.scheduledEndAt ?? "",
    googleCalendarEventUrl: "",
  }));

  const manualUnified: UnifiedTask[] = manualTasks.map((task) => ({
    key: `manual:${task.id}`,
    source: "manual" as const,
    projectId: task.projectId,
    manualTaskId: task.id,
    wbsNodeId: task.wbsNodeId,
    wbsLabel: task.wbsNodeId ? formatWbsNodeLabel(project.root, task.wbsNodeId) : "",
    category: task.wbsNodeId
      ? getWbsTopCategory(project.root, task.wbsNodeId)
      : task.category,
    title: task.title,
    detail: task.detail,
    assignee: task.assignee,
    status: task.status,
    priority: task.priority,
    startDate: task.startDate,
    endDate: task.endDate,
    scheduledAt: task.scheduledAt,
    scheduledEndAt: task.scheduledEndAt,
    googleCalendarEventUrl: task.googleCalendarEventUrl,
  }));

  return [...wbsTasks, ...manualUnified];
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

export function matchesUnifiedTaskQuery(task: UnifiedTask, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [
    task.category,
    task.title,
    task.detail,
    task.assignee,
    task.wbsLabel,
  ]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function filterUnifiedTasks(
  tasks: UnifiedTask[],
  options: { query?: string; assignee?: string },
): UnifiedTask[] {
  return tasks.filter((task) => {
    if (options.assignee && options.assignee !== "all") {
      const taskAssignee = task.assignee.trim() || "未割当";
      if (taskAssignee !== options.assignee) {
        return false;
      }
    }

    return matchesUnifiedTaskQuery(task, options.query ?? "");
  });
}
