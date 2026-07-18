import { flattenWbsBoard } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";
import type { WbsContextNode } from "@/types/meeting-notes";

export const MEETING_NOTES_MAX_LENGTH = 30_000;

export const MEETING_NOTES_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "proposals"],
  properties: {
    summary: {
      type: "string",
      description: "Brief Japanese summary of what was extracted (e.g. 3 new tasks, 2 updates).",
    },
    proposals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "action",
          "targetNodeId",
          "parentNodeId",
          "name",
          "description",
          "assignee",
          "startDate",
          "endDate",
          "status",
          "notes",
          "confidence",
          "reasoning",
        ],
        properties: {
          action: {
            type: "string",
            enum: ["create", "update"],
          },
          targetNodeId: {
            type: ["string", "null"],
            description: "Required for update: existing WBS node id from context.",
          },
          parentNodeId: {
            type: ["string", "null"],
            description: "For create: parent node id. Omit or null for top-level under project root.",
          },
          name: { type: "string" },
          description: { type: ["string", "null"] },
          assignee: { type: ["string", "null"] },
          startDate: {
            type: ["string", "null"],
            description: "YYYY-MM-DD if mentioned.",
          },
          endDate: {
            type: ["string", "null"],
            description: "YYYY-MM-DD if mentioned.",
          },
          status: {
            type: ["string", "null"],
            enum: ["not_started", "in_progress", "done", "on_hold", null],
          },
          notes: {
            type: ["string", "null"],
            description: "Evidence or quote from meeting notes supporting this proposal.",
          },
          confidence: {
            type: "string",
            enum: ["high", "medium", "low"],
          },
          reasoning: {
            type: "string",
            description: "Japanese explanation of why this proposal was made.",
          },
        },
      },
    },
  },
} as const;

export function buildMeetingNotesPrompt(input: {
  notesText: string;
  meetingTitle?: string;
  meetingDate?: string;
  wbsContext: WbsContextNode[];
}): { system: string; user: string } {
  const wbsLines =
    input.wbsContext.length === 0
      ? "（WBS 項目はまだありません）"
      : input.wbsContext
          .map(
            (node) =>
              `- id=${node.id} code=${node.code} depth=${node.depth} name="${node.name}" status=${node.status ?? "not_started"} start=${node.startDate ?? ""} end=${node.endDate ?? ""} assignee=${node.assignee ?? ""}`,
          )
          .join("\n");

  const system = `You are a project management assistant for a Japanese WBS (Work Breakdown Structure) tool.
Extract actionable tasks and status/date updates from meeting notes.

Rules:
- Output JSON matching the schema only.
- Use action "create" for new tasks not clearly matching existing WBS items.
- Use action "update" when meeting notes clearly refer to an existing WBS item (match by id from context).
- For updates, only include fields that should change; use null for unknown optional fields.
- Dates must be YYYY-MM-DD when provided.
- status values: not_started, in_progress, done, on_hold.
- WBS has max 3 levels (depth 0=top category, 1=child, 2=grandchild). Prefer parentNodeId at depth 0 or 1 for new items.
- Write summary and reasoning in Japanese.
- Be conservative: use confidence "low" when ambiguous.`;

  const user = [
    input.meetingTitle ? `Meeting title: ${input.meetingTitle}` : "",
    input.meetingDate ? `Meeting date: ${input.meetingDate}` : "",
    "",
    "Current WBS items:",
    wbsLines,
    "",
    "Meeting notes:",
    input.notesText,
  ]
    .filter((line, index, arr) => line !== "" || (index > 0 && arr[index - 1] !== ""))
    .join("\n");

  return { system, user };
}

export function buildWbsContextFromRoot(root: WbsNode): WbsContextNode[] {
  return flattenWbsBoard(root).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    depth: row.depth,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    assignee: row.assignee,
  }));
}
