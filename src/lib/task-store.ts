import type { ProjectTask, TaskInput } from "@/types/task";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { normalizeWbsStatus } from "@/lib/wbs-task-meta";
import { createId } from "@/lib/wbs";

const TASKS_STORAGE_KEY = "0-wbs:tasks";

type TaskRow = {
  id: string;
  project_id: string;
  category: string;
  title: string;
  detail: string;
  assignee: string;
  wbs_node_id: string;
  status: ProjectTask["status"];
  priority: ProjectTask["priority"];
  start_date: string;
  end_date: string;
  scheduled_at: string;
  scheduled_end_at: string;
  google_calendar_event_url: string;
  created_at: string;
  updated_at: string;
};

function readLocalTasks(): ProjectTask[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(TASKS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as ProjectTask[]).map(normalizeTask);
  } catch {
    return [];
  }
}

function writeLocalTasks(tasks: ProjectTask[]): void {
  window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function normalizeTask(task: ProjectTask): ProjectTask {
  return {
    ...task,
    assignee: task.assignee ?? "",
    wbsNodeId: task.wbsNodeId ?? "",
    status: normalizeWbsStatus(task.status),
    scheduledAt: task.scheduledAt ?? "",
    scheduledEndAt: task.scheduledEndAt ?? "",
    googleCalendarEventUrl: task.googleCalendarEventUrl ?? "",
  };
}

function rowToTask(row: TaskRow): ProjectTask {
  return normalizeTask({
    id: row.id,
    projectId: row.project_id,
    category: row.category,
    title: row.title,
    detail: row.detail,
    assignee: row.assignee ?? "",
    wbsNodeId: row.wbs_node_id ?? "",
    status: row.status ?? "not_started",
    priority: row.priority,
    startDate: row.start_date,
    endDate: row.end_date,
    scheduledAt: row.scheduled_at ?? "",
    scheduledEndAt: row.scheduled_end_at ?? "",
    googleCalendarEventUrl: row.google_calendar_event_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function taskToRow(task: ProjectTask): TaskRow {
  return {
    id: task.id,
    project_id: task.projectId,
    category: task.category,
    title: task.title,
    detail: task.detail,
    assignee: task.assignee,
    wbs_node_id: task.wbsNodeId,
    status: task.status,
    priority: task.priority,
    start_date: task.startDate,
    end_date: task.endDate,
    scheduled_at: task.scheduledAt,
    scheduled_end_at: task.scheduledEndAt,
    google_calendar_event_url: task.googleCalendarEventUrl,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
  };
}

async function listTasksFromSupabase(projectId: string): Promise<ProjectTask[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_project_tasks")
    .select("*")
    .eq("project_id", projectId);

  if (error) {
    throw new Error(error.message);
  }

  return (data as TaskRow[]).map(rowToTask);
}

async function getTaskFromSupabase(
  projectId: string,
  taskId: string,
): Promise<ProjectTask | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_project_tasks")
    .select("*")
    .eq("project_id", projectId)
    .eq("id", taskId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToTask(data as TaskRow) : null;
}

function sortTasks(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort((left, right) => {
    const categoryCompare = left.category.localeCompare(right.category, "ja");
    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return left.title.localeCompare(right.title, "ja");
  });
}

export async function listProjectTasks(projectId: string): Promise<ProjectTask[]> {
  if (!isSupabaseConfigured()) {
    return sortTasks(readLocalTasks().filter((task) => task.projectId === projectId));
  }

  return sortTasks(await listTasksFromSupabase(projectId));
}

export async function getProjectTask(
  projectId: string,
  taskId: string,
): Promise<ProjectTask | null> {
  if (!isSupabaseConfigured()) {
    return (
      readLocalTasks().find(
        (task) => task.projectId === projectId && task.id === taskId,
      ) ?? null
    );
  }

  return getTaskFromSupabase(projectId, taskId);
}

export async function createProjectTask(
  projectId: string,
  input: TaskInput,
): Promise<ProjectTask> {
  const now = new Date().toISOString();
  const task: ProjectTask = {
    id: createId(),
    projectId,
    category: input.category.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    assignee: input.assignee.trim(),
    wbsNodeId: input.wbsNodeId.trim(),
    status: normalizeWbsStatus(input.status),
    priority: input.priority,
    startDate: input.startDate,
    endDate: input.endDate,
    scheduledAt: input.scheduledAt,
    scheduledEndAt: input.scheduledEndAt,
    googleCalendarEventUrl: input.googleCalendarEventUrl,
    createdAt: now,
    updatedAt: now,
  };

  if (!isSupabaseConfigured()) {
    writeLocalTasks([task, ...readLocalTasks()]);
    return task;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_project_tasks").insert(taskToRow(task));

  if (error) {
    throw new Error(error.message);
  }

  return task;
}

export async function updateProjectTask(
  projectId: string,
  taskId: string,
  input: TaskInput,
): Promise<ProjectTask | null> {
  if (!isSupabaseConfigured()) {
    const tasks = readLocalTasks();
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
      scheduledAt: input.scheduledAt,
      scheduledEndAt: input.scheduledEndAt,
      googleCalendarEventUrl: input.googleCalendarEventUrl,
      updatedAt: new Date().toISOString(),
    };

    const nextTasks = [...tasks];
    nextTasks[index] = updated;
    writeLocalTasks(nextTasks);
    return updated;
  }

  const existing = await getTaskFromSupabase(projectId, taskId);
  if (!existing) {
    return null;
  }

  const updated: ProjectTask = {
    ...existing,
    category: input.category.trim(),
    title: input.title.trim(),
    detail: input.detail.trim(),
    assignee: input.assignee.trim(),
    wbsNodeId: input.wbsNodeId.trim(),
    status: normalizeWbsStatus(input.status),
    priority: input.priority,
    startDate: input.startDate,
    endDate: input.endDate,
    scheduledAt: input.scheduledAt,
    scheduledEndAt: input.scheduledEndAt,
    googleCalendarEventUrl: input.googleCalendarEventUrl,
    updatedAt: new Date().toISOString(),
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_project_tasks").upsert(taskToRow(updated));

  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

export async function deleteProjectTask(projectId: string, taskId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    writeLocalTasks(
      readLocalTasks().filter(
        (task) => !(task.projectId === projectId && task.id === taskId),
      ),
    );
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("wbs_project_tasks")
    .delete()
    .eq("project_id", projectId)
    .eq("id", taskId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function listProjectTaskCategories(projectId: string): Promise<string[]> {
  const categories = new Set<string>();

  for (const task of await listProjectTasks(projectId)) {
    if (task.category) {
      categories.add(task.category);
    }
  }

  return [...categories].sort((left, right) => left.localeCompare(right, "ja"));
}
