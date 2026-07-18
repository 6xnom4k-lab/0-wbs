"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import { Fragment } from "react";

import { WBS_GANTT_BASE_PADDING, WBS_GANTT_INDENT_STEP } from "@/components/wbs-gantt/constants";
import { WbsAddForm } from "@/components/wbs-gantt/wbs-add-form";
import { WbsCollapseToggle } from "@/components/wbs-gantt/wbs-collapse-toggle";
import { WbsDragHandle } from "@/components/wbs-gantt/wbs-drag-handle";
import { WbsRowActions } from "@/components/wbs-gantt/wbs-row-actions";
import { WbsMetaCell } from "@/components/wbs-gantt/wbs-table-parts";
import type { WbsGanttRowProps } from "@/components/wbs-gantt/types";
import {
  focusWbsRowName,
  getDropPosition,
  getRowChromeClasses,
} from "@/components/wbs-gantt/utils";
import { TaskProgressEditor } from "@/components/task-progress-bar";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { WbsStatusQuickSelect } from "@/components/wbs-status-badge";
import { WbsAssigneeQuickSelect } from "@/components/wbs-assignee-quick-select";
import { GANTT_ROW_HEIGHT } from "@/lib/gantt-utils";
import { computeNodeProgress, syncProgressWithStatus } from "@/lib/task-progress";
import { formatEffort, formatTableDate, hasTaskMeta } from "@/lib/wbs-task-meta";
import {
  addChild,
  addSibling,
  countDescendantNodes,
  deleteBoardNode,
  findNode,
  hasDescendants,
  updateNode,
} from "@/lib/wbs";
import type { WbsTaskStatus } from "@/types/wbs";

export function WbsGanttRow({
  row,
  rowIndex,
  root,
  assigneeOptions,
  onChange,
  pendingAdd,
  onStartAdd,
  onCancelAdd,
  onToggleCollapse,
  dragSourceId,
  dropTarget,
  canDropInside,
  onDragStart,
  onDragEnd,
  onDragOverRow,
  onDropRow,
  onOpenTask,
  gridCols,
  tableMinWidth,
  showOptionalColumns,
}: WbsGanttRowProps) {
  const confirm = useConfirm();
  const [draftName, setDraftName] = useState(row.name);

  useEffect(() => {
    setDraftName(row.name);
  }, [row.name]);
  const isAddingHere = pendingAdd?.targetId === row.id;
  const isDragging = dragSourceId === row.id;
  const isDropTarget = dropTarget?.id === row.id;
  const dropPosition = isDropTarget ? dropTarget.position : null;

  const taskNode = useMemo(() => findNode(root, row.id), [root, row.id]);
  const isRollup = Boolean(taskNode && taskNode.children.length > 0);
  const rollupProgress = taskNode ? computeNodeProgress(taskNode) : 0;

  const handleRowDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    onDragOverRow(row.id, getDropPosition(event, canDropInside));
  };

  const handleRowDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onDropRow(row.id, getDropPosition(event, canDropInside));
  };

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === row.name) {
      setDraftName(row.name);
      return;
    }

    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        name: trimmed,
      })),
    );
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleRename();
      focusWbsRowName(rowIndex);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      handleRename();
      focusWbsRowName(rowIndex);
    }
  };

  const handleAddSubmit = (name: string) => {
    if (!pendingAdd) {
      return;
    }

    if (pendingAdd.mode === "child") {
      if (!row.canAddChild) {
        onCancelAdd();
        return;
      }
      onChange(addChild(root, row.id, name));
    } else {
      onChange(addSibling(root, row.id, name));
    }

    onCancelAdd();
  };

  const handleDelete = async () => {
    const node = findNode(root, row.id);
    const descendantCount = node ? countDescendantNodes(node) : 0;
    const description =
      node && hasDescendants(node)
        ? `「${row.name}」と配下の作業項目 ${descendantCount} 件を削除します。この操作は取り消せません。`
        : `「${row.name}」を削除します。この操作は取り消せません。`;

    const confirmed = await confirm({
      title: "作業項目の削除",
      description,
      confirmLabel: "削除",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    onChange(deleteBoardNode(root, row.id));
  };

  const handleStatusChange = (nextStatus: WbsTaskStatus) => {
    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        status: nextStatus,
        progressPercent: syncProgressWithStatus(nextStatus, current.progressPercent),
      })),
    );
  };

  const handleProgressChange = (nextProgress: number, nextStatus: WbsTaskStatus) => {
    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        progressPercent: nextProgress,
        status: nextStatus,
      })),
    );
  };

  const handleAssigneeChange = (assignee: string) => {
    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        assignee,
      })),
    );
    focusWbsRowName(rowIndex);
  };

  return (
    <Fragment>
      <div
        className={`group/row grid w-full items-center gap-0 overflow-visible border-b border-zinc-800 py-1.5 transition-colors group-hover/row:bg-zinc-900/60 ${
          row.isRoot ? "bg-zinc-950" : "bg-zinc-950/80"
        } ${getRowChromeClasses(row, rowIndex, isDragging, dropPosition)}`}
        style={{
          gridTemplateColumns: gridCols,
          minWidth: tableMinWidth,
          minHeight: GANTT_ROW_HEIGHT,
        }}
        onDragOver={handleRowDragOver}
        onDrop={handleRowDrop}
      >
        <div className="flex items-center justify-center">
          <WbsDragHandle
            label={`${row.name} を並び替え`}
            onDragStart={() => onDragStart(row.id)}
            onDragEnd={onDragEnd}
          />
        </div>

        <div
          className="flex min-w-0 items-center gap-0.5 self-stretch py-0.5 pr-1"
          style={{ paddingLeft: WBS_GANTT_BASE_PADDING + row.depth * WBS_GANTT_INDENT_STEP }}
        >
          <WbsCollapseToggle row={row} onToggle={() => onToggleCollapse(row.id)} />
          <span
            className={`shrink-0 font-mono tabular-nums leading-5 ${
              row.isRoot ? "text-xs font-medium text-zinc-400" : "text-[11px] text-zinc-500"
            }`}
          >
            {row.code}
          </span>
          <input
            value={draftName}
            title={draftName}
            data-wbs-row-name
            data-row-index={rowIndex}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={handleRename}
            onKeyDown={handleNameKeyDown}
            className={`min-h-7 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-1 text-sm leading-5 outline-none focus:border-zinc-700 ${
              row.isRoot ? "font-semibold text-white" : "text-zinc-200"
            }`}
          />
          {row.isCollapsed && row.hiddenCount > 0 && (
            <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {row.hiddenCount}
            </span>
          )}
        </div>

        {showOptionalColumns && <WbsMetaCell value={row.description} />}
        <div className="px-1">
          <WbsAssigneeQuickSelect
            value={row.assignee}
            options={assigneeOptions}
            compact
            onChange={handleAssigneeChange}
          />
        </div>
        <WbsMetaCell value={formatTableDate(row.startDate)} className="tabular-nums" />
        <WbsMetaCell value={formatTableDate(row.endDate)} className="tabular-nums" />
        <div className="px-1">
          <WbsStatusQuickSelect
            status={row.status}
            compact
            onStatusChange={handleStatusChange}
          />
        </div>
        {showOptionalColumns && (
          <>
            <div className="px-1">
              <TaskProgressEditor
                progressPercent={isRollup ? rollupProgress : row.progressPercent}
                status={row.status}
                compact
                readOnly={isRollup}
                isRollup={isRollup}
                onChange={handleProgressChange}
              />
            </div>
            <span className="block px-1 text-center text-xs tabular-nums text-zinc-400">
              {formatEffort(row.effort) || "—"}
            </span>
            <WbsMetaCell value={row.notes} />
          </>
        )}

        <div className="flex justify-end pr-1">
          <WbsRowActions
            nodeId={row.id}
            rowName={row.name}
            hasNotes={(() => {
              const node = findNode(root, row.id);
              return node ? hasTaskMeta(node) : false;
            })()}
            isActive={false}
            canAddChild={row.canAddChild}
            onOpenTask={onOpenTask}
            onAddChild={() => onStartAdd("child", row.id)}
            onAddSibling={() => onStartAdd("sibling", row.id)}
            onDelete={() => void handleDelete()}
          />
        </div>
      </div>

      {isAddingHere && pendingAdd && pendingAdd.mode !== "top" && (
        <WbsAddForm
          mode={pendingAdd.mode}
          depth={row.depth}
          gridCols={gridCols}
          minWidth={tableMinWidth}
          onSubmit={handleAddSubmit}
          onCancel={onCancelAdd}
        />
      )}
    </Fragment>
  );
}
