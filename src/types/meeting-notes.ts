import type { TaskInput, TaskPriority } from "@/types/task";
import type { WbsTaskStatus } from "@/types/wbs";

export type WbsProposalAction = "create" | "update";

export type WbsProposalConfidence = "high" | "medium" | "low";

export type WbsContextNode = {
  id: string;
  code: string;
  name: string;
  depth: number;
  status?: WbsTaskStatus;
  startDate?: string;
  endDate?: string;
  assignee?: string;
};

export type WbsTaskProposal = {
  id: string;
  action: WbsProposalAction;
  targetNodeId?: string;
  parentNodeId?: string;
  name: string;
  description?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  status?: WbsTaskStatus;
  notes?: string;
  confidence: WbsProposalConfidence;
  reasoning: string;
};

export type MeetingNotesAnalyzeRequest = {
  notesText: string;
  meetingTitle?: string;
  meetingDate?: string;
  wbsContext: WbsContextNode[];
};

export type MeetingNotesAnalyzeResponse = {
  proposals: WbsTaskProposal[];
  taskProposals: ManualTaskProposal[];
  summary: string;
};

export type ProposalSelection = WbsTaskProposal & {
  selected: boolean;
};

export type ApplyProposalsResult = {
  root: import("@/types/wbs").WbsNode;
  appliedCount: number;
  skipped: Array<{ proposalId: string; reason: string }>;
};

export type ApplyImportResult = {
  root: import("@/types/wbs").WbsNode;
  wbsAppliedCount: number;
  wbsSkippedCount: number;
  manualTasksCreated: number;
  manualTasksSkipped: number;
  manualTaskInputs: TaskInput[];
};

export type ManualTaskProposal = {
  id: string;
  title: string;
  category?: string;
  detail?: string;
  assignee?: string;
  wbsNodeId?: string;
  startDate?: string;
  endDate?: string;
  status?: WbsTaskStatus;
  priority?: TaskPriority;
  notes?: string;
  confidence: WbsProposalConfidence;
  reasoning: string;
};

export type ManualTaskProposalSelection = ManualTaskProposal & {
  selected: boolean;
};
