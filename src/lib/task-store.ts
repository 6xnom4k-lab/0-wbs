import type { ProjectTask, TaskInput } from "@/types/task";

import { createId } from "@/lib/wbs";

const TASKS_STORAGE_KEY = "0-wbs:tasks";

function readTasks(): ProjectTask[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ProjectTask[];
  } catch {
    return [];
  }
}

function writeTasks(tasks: ProjectTask[]): void {
  window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

export function listProjectTasks(projectId: string): ProjectTask[] {
  return readTasks()
    .filter((task) => task.projectId === projectId)
    .sort((left, right) => {
      const categoryCompare = left.category.localeCompare(right.category, "ja");
      if (categoryCompare !== 0) {
        return categoryCompare;
      }

      return left.title.localeCompare(right.title, "ja");
    });
}

export function getProjectTask(projectId: string, taskId: string): ProjectTask | null {
  return (
    readTasks().find(
      (task) => task.projectId === projectId && task.id === taskId,
    ) ?? null
  );
}

export function createProjectTask(projectId: string, input: TaskInput): ProjectTask {
  const now = new Date().toISOString();
  const task: ProjectTask = {
    id: createId(),
    projectId,
    category: input.category.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    priority: input.priority,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: now,
    updatedAt: now,
  };

  writeTasks([task, ...readTasks()]);
  return task;
}

export function updateProjectTask(
  projectId: string,
  taskId: string,
  input: TaskInput,
): ProjectTask | null {
  const tasks = readTasks();
  const index = tasks.findIndex(
    (task) => task.projectId === projectId && task.id === taskId,
  );

  if (index === -1) {
    return null;
  }

  const updated: ProjectTask = {
    ...tasks[index],
    category: input.category.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    priority: input.priority,
    startDate: input.startDate,
    endDate: input.endDate,
    updatedAt: new Date().toISOString(),
  };

  const nextTasks = [...tasks];
  nextTasks[index] = updated;
  writeTasks(nextTasks);
  return updated;
}

export function deleteProjectTask(projectId: string, taskId: string): void {
  writeTasks(
    readTasks().filter(
      (task) => !(task.projectId === projectId && task.id === taskId),
    ),
  );
}

export function listProjectTaskCategories(projectId: string): string[] {
  const categories = new Set<string>();

  for (const task of listProjectTasks(projectId)) {
    if (task.category) {
      categories.add(task.category);
    }
  }

  return [...categories].sort((left, right) => left.localeCompare(right, "ja"));
}
