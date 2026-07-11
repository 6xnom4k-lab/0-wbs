import type { ProjectTask, TaskInput, TaskPriority } from "@/types/task";

export const TASK_PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

export function getTaskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_OPTIONS.find((option) => option.value === priority)?.label ?? priority;
}

export function getTaskPriorityClassName(priority: TaskPriority): string {
  switch (priority) {
    case "high":
      return "bg-red-950/50 text-red-300 ring-red-900/60";
    case "medium":
      return "bg-amber-950/50 text-amber-300 ring-amber-900/60";
    case "low":
      return "bg-zinc-900 text-zinc-400 ring-zinc-800";
  }
}

export function formatTaskPeriod(startDate: string, endDate: string): string {
  if (!startDate && !endDate) {
    return "未設定";
  }

  const start = startDate ? formatTaskDate(startDate) : "—";
  const end = endDate ? formatTaskDate(endDate) : "—";

  return `${start} 〜 ${end}`;
}

export function formatTaskDate(value: string): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
}

export function matchesTaskQuery(task: ProjectTask, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [task.category, task.title, task.detail]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function validateTaskInput(input: TaskInput): string | null {
  if (!input.title.trim()) {
    return "項目名を入力してください。";
  }

  if (input.startDate && input.endDate && input.startDate > input.endDate) {
    return "対応期間の終了日は開始日以降にしてください。";
  }

  return null;
}

export function emptyTaskInput(): TaskInput {
  return {
    category: "",
    title: "",
    detail: "",
    priority: "medium",
    startDate: "",
    endDate: "",
  };
}

export function toTaskInput(task: ProjectTask): TaskInput {
  return {
    category: task.category,
    title: task.title,
    detail: task.detail,
    priority: task.priority,
    startDate: task.startDate,
    endDate: task.endDate,
  };
}
