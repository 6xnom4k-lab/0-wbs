import { createId } from "@/lib/wbs";
import type { ProjectAssignee, WbsProject } from "@/types/wbs";

export function normalizeProjectAssignees(project: WbsProject): WbsProject {
  const assignees = Array.isArray(project.assignees)
    ? project.assignees.filter(
        (item): item is ProjectAssignee =>
          Boolean(item && typeof item.id === "string" && typeof item.name === "string"),
      )
    : [];

  return {
    ...project,
    assignees,
  };
}

export function listProjectAssigneeNames(project: WbsProject): string[] {
  return normalizeProjectAssignees(project).assignees.map((assignee) => assignee.name);
}

export function addProjectAssignee(
  project: WbsProject,
  input: { name: string; accountId?: string },
): { project: WbsProject; error?: string } {
  const name = input.name.trim();

  if (!name) {
    return { project, error: "担当者名を入力してください。" };
  }

  const normalized = normalizeProjectAssignees(project);

  if (normalized.assignees.some((assignee) => assignee.name === name)) {
    return { project: normalized, error: "同じ担当者が既に登録されています。" };
  }

  if (
    input.accountId &&
    normalized.assignees.some((assignee) => assignee.accountId === input.accountId)
  ) {
    return { project: normalized, error: "このアカウントは既に追加されています。" };
  }

  const nextAssignee: ProjectAssignee = {
    id: createId(),
    name,
    accountId: input.accountId,
  };

  return {
    project: {
      ...normalized,
      assignees: [...normalized.assignees, nextAssignee],
    },
  };
}

export function removeProjectAssignee(project: WbsProject, assigneeId: string): WbsProject {
  const normalized = normalizeProjectAssignees(project);

  return {
    ...normalized,
    assignees: normalized.assignees.filter((assignee) => assignee.id !== assigneeId),
  };
}

export function countWbsNodesWithAssignee(root: WbsProject["root"], name: string): number {
  let count = 0;

  function walk(node: WbsProject["root"]): void {
    if (node.code !== "0" && node.assignee?.trim() === name) {
      count += 1;
    }

    for (const child of node.children) {
      walk(child);
    }
  }

  walk(root);
  return count;
}
