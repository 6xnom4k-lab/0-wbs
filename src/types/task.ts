export type TaskPriority = "high" | "medium" | "low";

export type ProjectTask = {
  id: string;
  projectId: string;
  category: string;
  title: string;
  detail: string;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  scheduledAt: string;
  scheduledEndAt: string;
  googleCalendarEventUrl: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskInput = Pick<
  ProjectTask,
  | "category"
  | "title"
  | "detail"
  | "priority"
  | "startDate"
  | "endDate"
  | "scheduledAt"
  | "scheduledEndAt"
  | "googleCalendarEventUrl"
>;
