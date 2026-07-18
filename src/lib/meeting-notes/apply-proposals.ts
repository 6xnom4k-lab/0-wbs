import {
  addChild,
  canAddChildToNode,
  findNode,
  getNodeDepth,
  updateNode,
} from "@/lib/wbs";
import { getWbsStatusLabel, parseISODate } from "@/lib/wbs-task-meta";
import type { ApplyProposalsResult, WbsTaskProposal } from "@/types/meeting-notes";
import type { WbsNode, WbsTaskStatus } from "@/types/wbs";

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

function buildUpdatePatch(proposal: WbsTaskProposal): Partial<WbsNode> {
  const patch: Partial<WbsNode> = {};

  if (proposal.description !== undefined) {
    patch.description = proposal.description;
  }

  if (proposal.assignee !== undefined) {
    patch.assignee = proposal.assignee;
  }

  if (proposal.startDate !== undefined) {
    patch.startDate = proposal.startDate;
  }

  if (proposal.endDate !== undefined) {
    patch.endDate = proposal.endDate;
  }

  if (proposal.status !== undefined) {
    patch.status = proposal.status;
  }

  if (proposal.notes !== undefined) {
    patch.notes = proposal.notes;
  }

  return patch;
}

function applyCreate(
  root: WbsNode,
  proposal: WbsTaskProposal,
): { root: WbsNode; applied: boolean; reason?: string } {
  const parentId = proposal.parentNodeId ?? root.id;

  if (!findNode(root, parentId)) {
    return { root, applied: false, reason: "追加先の親項目が見つかりません。" };
  }

  if (!canAddChildToNode(root, parentId)) {
    return { root, applied: false, reason: "WBS の階層上限（3階層）を超えるため追加できません。" };
  }

  if (!isValidDateRange(proposal.startDate, proposal.endDate)) {
    return { root, applied: false, reason: "日付の形式または期間が不正です。" };
  }

  let nextRoot = addChild(root, parentId, proposal.name);
  const parent = findNode(nextRoot, parentId);
  const created = parent?.children[parent.children.length - 1];

  if (!created) {
    return { root, applied: false, reason: "項目の追加に失敗しました。" };
  }

  nextRoot = updateNode(nextRoot, created.id, (current) => ({
    ...current,
    ...buildUpdatePatch(proposal),
  }));

  return { root: nextRoot, applied: true };
}

function applyUpdate(
  root: WbsNode,
  proposal: WbsTaskProposal,
): { root: WbsNode; applied: boolean; reason?: string } {
  if (!proposal.targetNodeId) {
    return { root, applied: false, reason: "更新対象の ID がありません。" };
  }

  const existing = findNode(root, proposal.targetNodeId);
  if (!existing) {
    return { root, applied: false, reason: "更新対象の項目が見つかりません。" };
  }

  const nextStart = proposal.startDate ?? existing.startDate;
  const nextEnd = proposal.endDate ?? existing.endDate;

  if (!isValidDateRange(nextStart, nextEnd)) {
    return { root, applied: false, reason: "日付の形式または期間が不正です。" };
  }

  const nextRoot = updateNode(root, proposal.targetNodeId, (current) => ({
    ...current,
    name: proposal.name || current.name,
    ...buildUpdatePatch(proposal),
  }));

  return { root: nextRoot, applied: true };
}

export function applyWbsProposals(
  root: WbsNode,
  proposals: WbsTaskProposal[],
): ApplyProposalsResult {
  let nextRoot = root;
  let appliedCount = 0;
  const skipped: ApplyProposalsResult["skipped"] = [];

  for (const proposal of proposals) {
    if (proposal.action === "create") {
      const result = applyCreate(nextRoot, proposal);
      if (result.applied) {
        nextRoot = result.root;
        appliedCount += 1;
      } else {
        skipped.push({
          proposalId: proposal.id,
          reason: result.reason ?? "追加をスキップしました。",
        });
      }
      continue;
    }

    const result = applyUpdate(nextRoot, proposal);
    if (result.applied) {
      nextRoot = result.root;
      appliedCount += 1;
    } else {
      skipped.push({
        proposalId: proposal.id,
        reason: result.reason ?? "更新をスキップしました。",
      });
    }
  }

  return { root: nextRoot, appliedCount, skipped };
}

export function getProposalTargetLabel(root: WbsNode, proposal: WbsTaskProposal): string {
  if (proposal.action === "update" && proposal.targetNodeId) {
    const node = findNode(root, proposal.targetNodeId);
    return node ? `${node.code} ${node.name}` : "（不明な項目）";
  }

  if (proposal.parentNodeId) {
    const parent = findNode(root, proposal.parentNodeId);
    const depth = getNodeDepth(root, proposal.parentNodeId);
    if (parent && depth !== null) {
      return `${parent.code} ${parent.name} の下`;
    }
  }

  return "トップレベル";
}

export function getStatusLabel(status: WbsTaskStatus | undefined): string {
  return getWbsStatusLabel(status);
}
