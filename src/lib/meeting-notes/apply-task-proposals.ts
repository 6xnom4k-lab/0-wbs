import type { TaskInput, TaskPriority } from "@/types/task";
import type { ManualTaskProposal } from "@/types/meeting-notes";
import type { WbsTaskStatus } from "@/types/wbs";

import { parseISODate } from "@/lib/wbs-task-meta";

const VALID_STATUS = new Set<WbsTaskStatus>([
  "not_started",
  "in_progress",
  "done",
  "on_hold",
]);

const VALID_PRIORITY = new Set<TaskPriority>(["high", "medium", "low"]);

function isValidDateRange(startDate?: string, endDate?: string): boolean {
  if (startDate && !parseISODate(startDate)) {
    return false;
  }

  if (endDate && !parseISODate(endDate)) {
    return false;
  }

  if (startDate && endDate) {
    const start = parseISODate(startDate);
    const end = parseISODate(endDate);
    if (start && end && end.getTime() < start.getTime()) {
      return false;
    }
  }

  return true;
}

export function manualProposalToTaskInput(proposal: ManualTaskProposal): TaskInput | null {
  const title = proposal.title.trim();
  if (!title) {
    return null;
  }

  if (!isValidDateRange(proposal.startDate, proposal.endDate)) {
    return null;
  }

  const status =
    proposal.status && VALID_STATUS.has(proposal.status) ? proposal.status : "not_started";
  const priority =
    proposal.priority && VALID_PRIORITY.has(proposal.priority) ? proposal.priority : "medium";

  return {
    category: proposal.category?.trim() ?? "",
    title,
    detail: proposal.detail?.trim() ?? "",
    notes: proposal.notes?.trim() ?? "",
    content: "",
    assignee: proposal.assignee?.trim() ?? "",
    wbsNodeId: proposal.wbsNodeId?.trim() ?? "",
    status,
    priority,
    startDate: proposal.startDate ?? "",
    endDate: proposal.endDate ?? "",
    scheduledAt: "",
    scheduledEndAt: "",
    googleCalendarEventUrl: "",
  };
}

export function applyManualTaskProposals(
  proposals: ManualTaskProposal[],
): { tasks: TaskInput[]; skipped: Array<{ proposalId: string; reason: string }> } {
  const tasks: TaskInput[] = [];
  const skipped: Array<{ proposalId: string; reason: string }> = [];

  for (const proposal of proposals) {
    const input = manualProposalToTaskInput(proposal);
    if (!input) {
      skipped.push({
        proposalId: proposal.id,
        reason: "タイトルまたは日付が不正なためスキップしました。",
      });
      continue;
    }

    tasks.push(input);
  }

  return { tasks, skipped };
}
