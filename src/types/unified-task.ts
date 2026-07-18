import type { WbsTaskStatus } from "@/types/wbs";
import type { TaskPriority } from "@/types/task";

export type UnifiedTaskSource = "manual" | "wbs";

export type UnifiedTask = {
  key: string;
  source: UnifiedTaskSource;
  projectId: string;
  manualTaskId?: string;
  wbsNodeId: string;
  wbsLabel: string;
  category: string;
  title: string;
  detail: string;
  assignee: string;
  status: WbsTaskStatus;
  progressPercent: number;
  priority: TaskPriority;
  startDate: string;
  endDate: string;
  scheduledAt: string;
  scheduledEndAt: string;
  googleCalendarEventUrl: string;
};

export type TaskViewMode = "all" | "byAssignee";

export const UNASSIGNED_ASSIGNEE_LABEL = "未割当";
