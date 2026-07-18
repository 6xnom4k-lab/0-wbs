import { normalizeWbsStatus, parseISODate } from "@/lib/wbs-task-meta";
import type {
  WbsProposalConfidence,
  WbsTaskProposal,
  WbsProposalAction,
} from "@/types/meeting-notes";
import type { WbsTaskStatus } from "@/types/wbs";

type RawProposal = {
  action?: string;
  targetNodeId?: string | null;
  parentNodeId?: string | null;
  name?: string;
  description?: string | null;
  assignee?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
  notes?: string | null;
  confidence?: string;
  reasoning?: string;
};

type RawResponse = {
  summary?: string;
  proposals?: RawProposal[];
};

const VALID_ACTIONS = new Set<WbsProposalAction>(["create", "update"]);
const VALID_CONFIDENCE = new Set<WbsProposalConfidence>(["high", "medium", "low"]);
const VALID_STATUS = new Set<WbsTaskStatus>([
  "not_started",
  "in_progress",
  "done",
  "on_hold",
]);

function normalizeOptionalString(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || undefined;
}

function normalizeDate(value: string | null | undefined): string | undefined {
  const trimmed = normalizeOptionalString(value);
  if (!trimmed) {
    return undefined;
  }

  return parseISODate(trimmed) ? trimmed : undefined;
}

function normalizeStatus(value: string | null | undefined): WbsTaskStatus | undefined {
  if (!value || !VALID_STATUS.has(value as WbsTaskStatus)) {
    return undefined;
  }

  return normalizeWbsStatus(value as WbsTaskStatus);
}

export function normalizeAnalyzeResponse(raw: unknown): {
  summary: string;
  proposals: WbsTaskProposal[];
} {
  const data = (raw ?? {}) as RawResponse;
  const summary =
    typeof data.summary === "string" && data.summary.trim()
      ? data.summary.trim()
      : "議事録から提案を抽出しました。";

  const proposals = Array.isArray(data.proposals)
    ? data.proposals
        .map((item): WbsTaskProposal | null => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const action = item.action as WbsProposalAction;
          if (!VALID_ACTIONS.has(action)) {
            return null;
          }

          const name = normalizeOptionalString(item.name);
          if (!name) {
            return null;
          }

          const confidence = VALID_CONFIDENCE.has(item.confidence as WbsProposalConfidence)
            ? (item.confidence as WbsProposalConfidence)
            : "medium";

          const reasoning =
            normalizeOptionalString(item.reasoning) ?? "議事録の内容に基づく提案です。";

          if (action === "update" && !normalizeOptionalString(item.targetNodeId ?? undefined)) {
            return null;
          }

          return {
            id: crypto.randomUUID(),
            action,
            targetNodeId: normalizeOptionalString(item.targetNodeId ?? undefined),
            parentNodeId: normalizeOptionalString(item.parentNodeId ?? undefined),
            name,
            description: normalizeOptionalString(item.description ?? undefined),
            assignee: normalizeOptionalString(item.assignee ?? undefined),
            startDate: normalizeDate(item.startDate),
            endDate: normalizeDate(item.endDate),
            status: normalizeStatus(item.status),
            notes: normalizeOptionalString(item.notes ?? undefined),
            confidence,
            reasoning,
          };
        })
        .filter((item): item is WbsTaskProposal => item !== null)
    : [];

  return { summary, proposals };
}

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
