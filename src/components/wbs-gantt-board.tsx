"use client";

import { useEffect, useMemo, useState, type DragEvent } from "react";

import { GanttCalendarHeader, GanttCalendarRow } from "@/components/gantt-calendar";
import { PlusIcon } from "@/components/icons";
import {
  WBS_GANTT_DEFAULT_SPLIT_RATIO,
  WBS_GANTT_SPLIT_STORAGE_KEY,
} from "@/components/wbs-gantt/constants";
import { WbsAddForm } from "@/components/wbs-gantt/wbs-add-form";
import { WbsGanttRow } from "@/components/wbs-gantt/wbs-gantt-row";
import { WbsMobileBoard } from "@/components/wbs-gantt/wbs-mobile-board";
import { WbsTableHeader } from "@/components/wbs-gantt/wbs-table-parts";
import type { PendingAdd, WbsGanttBoardProps } from "@/components/wbs-gantt/types";
import { getDropPosition, getRowChromeClasses } from "@/components/wbs-gantt/utils";
import { useWbsBoardDnD } from "@/hooks/use-wbs-board-dnd";
import { useResizableSplit } from "@/hooks/use-resizable-split";
import {
  buildGanttTimeline,
  GANTT_DAY_COLUMN_WIDTH,
  getGanttBarRender,
} from "@/lib/gantt-utils";
import { computeNodeProgress } from "@/lib/task-progress";
import {
  buildWbsGridCols,
  getWbsTableMinWidth,
  readOptionalColumnsVisible,
  writeOptionalColumnsVisible,
} from "@/lib/wbs-table-config";
import { addChild, findNode } from "@/lib/wbs";

export function WbsGanttBoard({ root, assigneeOptions, onChange, onOpenTask }: WbsGanttBoardProps) {
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [showOptionalColumns, setShowOptionalColumns] = useState(false);

  const {
    dragSourceId,
    dropTarget,
    collapsedIds,
    canDropInsideById,
    visibleRows: rows,
    handleDragStart,
    handleDragEnd,
    handleDragOverRow,
    handleDropRow,
    handleToggleCollapse,
    handleCollapseAll,
    handleExpandAll,
  } = useWbsBoardDnD(root, onChange);

  useEffect(() => {
    setShowOptionalColumns(readOptionalColumnsVisible());
  }, []);

  const gridCols = useMemo(
    () => buildWbsGridCols(showOptionalColumns),
    [showOptionalColumns],
  );
  const tableMinWidth = useMemo(
    () => getWbsTableMinWidth(showOptionalColumns),
    [showOptionalColumns],
  );

  const timeline = useMemo(() => buildGanttTimeline(root), [root]);
  const { containerRef, splitRatio, isResizing, startPanelStyle, startResize } = useResizableSplit({
    storageKey: WBS_GANTT_SPLIT_STORAGE_KEY,
    defaultRatio: WBS_GANTT_DEFAULT_SPLIT_RATIO,
    minStartPx: tableMinWidth,
    minEndPx: 160,
  });

  const toggleOptionalColumns = () => {
    setShowOptionalColumns((current) => {
      const next = !current;
      writeOptionalColumnsVisible(next);
      return next;
    });
  };

  const handleHeaderAddTop = () => {
    setPendingAdd({ mode: "top", targetId: root.id });
  };

  const handleTopAddSubmit = (name: string) => {
    onChange(addChild(root, root.id, name));
    setPendingAdd(null);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-800">
      <WbsMobileBoard
        root={root}
        assigneeOptions={assigneeOptions}
        onOpenTask={onOpenTask}
        collapsedIds={collapsedIds}
        onToggleCollapse={handleToggleCollapse}
      />

      <div className="hidden md:block">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <p className="text-xs leading-5 text-zinc-500">
          <span className="text-zinc-400">1, 2, 3 …</span> = 親。
          <span className="text-zinc-400"> 1.1, 1.2 …</span> = 子。
          <span className="text-zinc-400"> 1.1.1 …</span> = 孫（3階層まで）。
          左端の <span className="text-zinc-400">⠿</span> をドラッグ。
          行の上/下で並び替え、中央付近で下層に追加。
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleOptionalColumns}
            className="rounded-md border border-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            {showOptionalColumns ? "詳細列を隠す" : "詳細列を表示"}
          </button>
          <button
            type="button"
            onClick={handleExpandAll}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            すべて展開
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="rounded-md px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            カテゴリを折りたたむ
          </button>
          <button
            type="button"
            onClick={handleHeaderAddTop}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
          >
            <PlusIcon className="h-3.5 w-3.5 shrink-0" />
            作業項目を追加
          </button>
        </div>
      </div>

      <div ref={containerRef} className={`flex min-w-0 ${isResizing ? "select-none" : ""}`}>
        <div style={startPanelStyle} className="flex min-w-0 flex-col overflow-x-auto bg-zinc-950">
          <WbsTableHeader
            gridCols={gridCols}
            minWidth={tableMinWidth}
            showOptionalColumns={showOptionalColumns}
          />

          {rows.length === 0 && !pendingAdd && (
            <div className="flex flex-col items-center justify-center gap-3 border-b border-zinc-800 px-4 py-12 text-center">
              <p className="text-sm text-zinc-500">まだ作業項目がありません</p>
              <button
                type="button"
                onClick={handleHeaderAddTop}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
              >
                <PlusIcon className="h-3.5 w-3.5 shrink-0" />
                作業項目を追加
              </button>
            </div>
          )}

          {pendingAdd?.mode === "top" && pendingAdd.targetId === root.id && (
            <WbsAddForm
              mode="top"
              depth={0}
              gridCols={gridCols}
              minWidth={tableMinWidth}
              onSubmit={handleTopAddSubmit}
              onCancel={() => setPendingAdd(null)}
            />
          )}

          {rows.map((row, index) => (
            <WbsGanttRow
              key={row.id}
              row={row}
              rowIndex={index}
              root={root}
              assigneeOptions={assigneeOptions}
              onChange={onChange}
              pendingAdd={pendingAdd}
              onStartAdd={(mode, targetId) => setPendingAdd({ mode, targetId })}
              onCancelAdd={() => setPendingAdd(null)}
              onToggleCollapse={handleToggleCollapse}
              dragSourceId={dragSourceId}
              dropTarget={dropTarget}
              canDropInside={canDropInsideById.get(row.id) ?? false}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOverRow={handleDragOverRow}
              onDropRow={handleDropRow}
              onOpenTask={onOpenTask}
              gridCols={gridCols}
              tableMinWidth={tableMinWidth}
              showOptionalColumns={showOptionalColumns}
            />
          ))}
        </div>

        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="WBSとガントの幅を調整"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(splitRatio * 100)}
          onPointerDown={startResize}
          className={`relative z-10 w-1 shrink-0 touch-none ${
            isResizing ? "bg-sky-500/60" : "bg-zinc-800 hover:bg-sky-500/40"
          } cursor-col-resize transition-colors`}
        >
          <div className="absolute inset-y-0 -left-1.5 -right-1.5" aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1 overflow-x-auto overscroll-x-contain bg-zinc-950/80">
          <div className="relative" style={{ width: timeline.chartWidthPx }}>
            <GanttCalendarHeader timeline={timeline} />

            {timeline.days.some((day) => day.isToday) && (
              <div
                className="pointer-events-none absolute bottom-0 top-0 z-[3] border-x border-amber-400/25 bg-amber-400/10"
                style={{
                  left: timeline.days.findIndex((day) => day.isToday) * GANTT_DAY_COLUMN_WIDTH,
                  width: GANTT_DAY_COLUMN_WIDTH,
                }}
                aria-hidden="true"
              />
            )}

            {rows.length === 0 && !pendingAdd && (
              <div className="flex h-24 items-center justify-center border-b border-zinc-800 text-xs text-zinc-600">
                ガントは作業項目追加後に表示されます
              </div>
            )}

            {rows.map((row, index) => {
              const node = findNode(root, row.id);
              const barProgress = node
                ? node.children.length > 0
                  ? computeNodeProgress(node)
                  : row.progressPercent
                : row.progressPercent;
              const bar = getGanttBarRender(
                row.startDate,
                row.endDate,
                row.status,
                timeline,
                barProgress,
              );
              const isDropTarget = dropTarget?.id === row.id;
              const dropPosition = isDropTarget ? dropTarget.position : null;

              const handleRowDragOver = (event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                handleDragOverRow(
                  row.id,
                  getDropPosition(event, canDropInsideById.get(row.id) ?? false),
                );
              };

              const handleRowDrop = (event: DragEvent<HTMLDivElement>) => {
                event.preventDefault();
                handleDropRow(
                  row.id,
                  getDropPosition(event, canDropInsideById.get(row.id) ?? false),
                );
              };

              return (
                <GanttCalendarRow
                  key={row.id}
                  row={row}
                  node={node}
                  timeline={timeline}
                  bar={bar}
                  rowChromeClass={getRowChromeClasses(
                    row,
                    index,
                    dragSourceId === row.id,
                    dropPosition,
                  )}
                  isDragging={dragSourceId === row.id}
                  onDragOver={handleRowDragOver}
                  onDrop={handleRowDrop}
                />
              );
            })}
          </div>
        </div>
      </div>

      <p className="border-t border-zinc-800 px-4 py-3 text-xs text-zinc-600">
        名称は Enter / ↓ で次の行へ。WBS表の各列をクリックして詳細を編集できます（↗
        ボタン）。ガントは右側で期間を確認できます。
      </p>
      </div>
    </div>
  );
}
