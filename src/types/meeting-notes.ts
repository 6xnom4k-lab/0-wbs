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
  summary: string;
};

export type ApplyProposalsResult = {
  root: import("@/types/wbs").WbsNode;
  appliedCount: number;
  skipped: Array<{ proposalId: string; reason: string }>;
};

export type ProposalSelection = WbsTaskProposal & {
  selected: boolean;
};
