"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type DragEvent } from "react";

import { GanttCalendarHeader, GanttCalendarRow } from "@/components/gantt-calendar";
import { IconButton } from "@/components/icon-button";
import { WbsStatusQuickSelect } from "@/components/wbs-status-badge";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DeleteIcon,
  ExternalLinkIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SubItemPlusIcon,
} from "@/components/icons";
import {
  buildGanttTimeline,
  GANTT_DAY_COLUMN_WIDTH,
  GANTT_HEADER_HEIGHT,
  GANTT_ROW_HEIGHT,
  getGanttBarRender,
} from "@/lib/gantt-utils";
import { useResizableSplit } from "@/hooks/use-resizable-split";
import {
  formatEffort,
  formatTableDate,
  hasTaskMeta,
} from "@/lib/wbs-task-meta";
import {
  addChild,
  addSibling,
  deleteBoardNode,
  findNode,
  flattenWbsBoard,
  hasDescendants,
  canDropNode,
  moveNode,
  updateNode,
  type WbsFlatRow,
} from "@/lib/wbs";
import type { WbsNode, WbsTaskStatus } from "@/types/wbs";

type WbsGanttBoardProps = {
  root: WbsNode;
  onChange: (root: WbsNode) => void;
  onOpenTask: (nodeId: string) => void;
};

type AddMode = "top" | "child" | "sibling";

type PendingAdd = {
  mode: AddMode;
  targetId: string;
};

type DropPosition = "before" | "after" | "inside";

type DropTarget = {
  id: string;
  position: DropPosition;
};

type WbsGanttRowProps = {
  row: WbsFlatRow;
  rowIndex: number;
  root: WbsNode;
  onChange: (root: WbsNode) => void;
  pendingAdd: PendingAdd | null;
  onStartAdd: (mode: AddMode, targetId: string) => void;
  onCancelAdd: () => void;
  onToggleCollapse: (nodeId: string) => void;
  dragSourceId: string | null;
  dropTarget: DropTarget | null;
  canDropInside: boolean;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDragOverRow: (nodeId: string, position: DropPosition) => void;
  onDropRow: (nodeId: string, position: DropPosition) => void;
  onOpenTask: (nodeId: string) => void;
};

const INDENT_STEP = 18;
const BASE_PADDING = 12;
const WBS_TABLE_MIN_WIDTH = 760;
const WBS_GANTT_SPLIT_STORAGE_KEY = "0-wbs-wbs-gantt-split-ratio";
const WBS_GANTT_DEFAULT_SPLIT_RATIO = 0.6;
const WBS_GRID_COLS =
  "28px minmax(168px,1.4fr) minmax(108px,1fr) 64px 76px 76px 72px 40px minmax(80px,0.9fr) 68px";

function WbsTableHeader() {
  return (
    <div
      className="grid shrink-0 items-center border-b border-zinc-800 bg-black/40 text-[10px] font-medium text-zinc-500"
      style={{
        gridTemplateColumns: WBS_GRID_COLS,
        height: GANTT_HEADER_HEIGHT,
        minWidth: WBS_TABLE_MIN_WIDTH,
      }}
    >
      <span />
      <span className="px-1">作業項目</span>
      <span className="px-1">詳細</span>
      <span className="px-1">担当</span>
      <span className="px-1">開始</span>
      <span className="px-1">終了</span>
      <span className="px-1">状態</span>
      <span className="px-1 text-center">工数</span>
      <span className="px-1">備考</span>
      <span />
    </div>
  );
}

function WbsMetaCell({
  value,
  className = "",
}: {
  value?: string;
  className?: string;
}) {
  if (!value) {
    return <span className={`px-1 text-[10px] text-zinc-700 ${className}`}>—</span>;
  }

  return (
    <span className={`block truncate px-1 text-[10px] text-zinc-400 ${className}`} title={value}>
      {value}
    </span>
  );
}

function getRowChromeClasses(
  row: WbsFlatRow,
  rowIndex: number,
  isDragging: boolean,
  dropPosition: DropPosition | null,
): string {
  return [
    row.isRoot && rowIndex > 0 ? "border-t border-zinc-800/90" : "",
    isDragging ? "opacity-40" : "",
    dropPosition === "before" ? "border-t-2 border-t-sky-500" : "",
    dropPosition === "after" ? "border-b-2 border-b-sky-500" : "",
    dropPosition === "inside" ? "bg-sky-950/25 ring-1 ring-inset ring-sky-500/50" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getDropPosition(
  event: DragEvent<HTMLDivElement>,
  canNestInside: boolean,
): DropPosition {
  const bounds = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientY - bounds.top) / bounds.height;

  if (canNestInside && ratio > 0.25 && ratio < 0.75) {
    return "inside";
  }

  return ratio < 0.5 ? "before" : "after";
}

function WbsDragHandle({
  label,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <button
      type="button"
      draggable
      aria-label={label}
      title={label}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", "wbs-row");
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="inline-flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing group-hover/row:opacity-100 group-focus-within/row:opacity-100"
    >
      <GripVerticalIcon className="h-3.5 w-3.5" />
    </button>
  );
}

function WbsCollapseToggle({
  row,
  onToggle,
}: {
  row: WbsFlatRow;
  onToggle: () => void;
}) {
  if (!row.hasChildren) {
    return <span className="w-5 shrink-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={row.isCollapsed ? `${row.name} を展開` : `${row.name} を折りたたむ`}
      aria-expanded={!row.isCollapsed}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
    >
      {row.isCollapsed ? (
        <ChevronRightIcon className="h-3.5 w-3.5" />
      ) : (
        <ChevronDownIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function getAddPlaceholder(mode: AddMode): string {
  if (mode === "top") {
    return "作業項目名（例: テスト）";
  }

  if (mode === "sibling") {
    return "同レベルの作業項目名";
  }

  return "子項目名（例: ヒアリング実施）";
}

function WbsAddForm({
  mode,
  depth,
  onSubmit,
  onCancel,
}: {
  mode: AddMode;
  depth: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
    setName("");
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/40">
      <div
        className="grid items-center gap-1 px-1 py-2"
        style={{
          gridTemplateColumns: WBS_GRID_COLS,
          minWidth: WBS_TABLE_MIN_WIDTH,
          paddingLeft: BASE_PADDING + depth * INDENT_STEP,
        }}
      >
        <span className="w-5 shrink-0" />
        <div className="col-span-9 flex min-w-0 flex-wrap items-center gap-2 pr-2">
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSubmit();
              }
              if (event.key === "Escape") {
                onCancel();
              }
            }}
            placeholder={getAddPlaceholder(mode)}
            className="min-w-40 flex-1 rounded-md border border-zinc-700 bg-black px-2 py-1 text-sm text-zinc-200 outline-none focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-white px-3 py-1 text-xs font-medium text-black"
          >
            追加
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1 text-xs font-medium text-zinc-400"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function WbsRowActions({
  nodeId,
  rowName,
  hasNotes,
  isActive,
  canAddChild,
  onOpenTask,
  onAddChild,
  onAddSibling,
  onDelete,
}: {
  nodeId: string;
  rowName: string;
  hasNotes: boolean;
  isActive: boolean;
  canAddChild: boolean;
  onOpenTask: (nodeId: string) => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const visibilityClass = isActive || menuOpen
    ? "opacity-100"
    : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100";

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 transition-opacity ${visibilityClass}`}
      ref={menuRef}
    >
      <div className="hidden items-center gap-0.5 sm:flex">
        <IconButton
          label={`${rowName} の作業ページを開く`}
          onClick={() => onOpenTask(nodeId)}
        >
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </IconButton>
        {hasNotes && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/80"
            title="作業記録あり"
          />
        )}
        {canAddChild && (
          <IconButton label="子項目を追加" onClick={onAddChild}>
            <SubItemPlusIcon className="h-3.5 w-3.5" />
          </IconButton>
        )}
        <IconButton label="同レベルに追加" onClick={onAddSibling}>
          <PlusIcon className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label={`${rowName} を削除`} tone="danger" onClick={onDelete}>
          <DeleteIcon className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div className="relative sm:hidden">
        <IconButton
          label={`${rowName} の操作`}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </IconButton>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 min-w-36 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onOpenTask(nodeId);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
              作業ページを開く
            </button>
            {canAddChild && (
              <button
                type="button"
                onClick={() => {
                  onAddChild();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
              >
                <SubItemPlusIcon className="h-3.5 w-3.5 shrink-0" />
                子項目を追加
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onAddSibling();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <PlusIcon className="h-3.5 w-3.5 shrink-0" />
              同レベルに追加
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/30"
            >
              <DeleteIcon className="h-3.5 w-3.5 shrink-0" />
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function WbsRowLeft({
  row,
  rowIndex,
  root,
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
}: WbsGanttRowProps) {
  const [draftName, setDraftName] = useState(row.name);
  const isAddingHere = pendingAdd?.targetId === row.id;
  const isDragging = dragSourceId === row.id;
  const isDropTarget = dropTarget?.id === row.id;
  const dropPosition = isDropTarget ? dropTarget.position : null;

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

  const handleDelete = () => {
    const node = findNode(root, row.id);
    const message =
      node && hasDescendants(node)
        ? `「${row.name}」と配下の作業項目を削除しますか？`
        : `「${row.name}」を削除しますか？`;

    if (!window.confirm(message)) {
      return;
    }

    onChange(deleteBoardNode(root, row.id));
  };

  const handleStatusChange = (nextStatus: WbsTaskStatus) => {
    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        status: nextStatus,
      })),
    );
  };

  return (
    <Fragment>
      <div
        className={`group/row grid w-full items-center gap-0 border-b border-zinc-800 py-0.5 transition-colors group-hover/row:bg-zinc-900/60 ${
          row.isRoot ? "bg-zinc-950" : "bg-zinc-950/80"
        } ${getRowChromeClasses(row, rowIndex, isDragging, dropPosition)}`}
        style={{
          gridTemplateColumns: WBS_GRID_COLS,
          minWidth: WBS_TABLE_MIN_WIDTH,
          height: GANTT_ROW_HEIGHT,
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
          className="flex min-w-0 items-center gap-0.5 pr-1"
          style={{ paddingLeft: BASE_PADDING + row.depth * INDENT_STEP }}
        >
          <WbsCollapseToggle row={row} onToggle={() => onToggleCollapse(row.id)} />
          <span
            className={`shrink-0 font-mono tabular-nums ${
              row.isRoot ? "text-xs font-medium text-zinc-400" : "text-[11px] text-zinc-500"
            }`}
          >
            {row.code}
          </span>
          <input
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onBlur={handleRename}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
            className={`min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 outline-none focus:border-zinc-700 ${
              row.isRoot ? "text-sm font-semibold text-white" : "text-sm text-zinc-200"
            }`}
          />
          {row.isCollapsed && row.hiddenCount > 0 && (
            <span className="shrink-0 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {row.hiddenCount}
            </span>
          )}
        </div>

        <WbsMetaCell value={row.description} />
        <WbsMetaCell value={row.assignee} />
        <WbsMetaCell value={formatTableDate(row.startDate)} className="tabular-nums" />
        <WbsMetaCell value={formatTableDate(row.endDate)} className="tabular-nums" />
        <div className="px-1">
          <WbsStatusQuickSelect
            status={row.status}
            compact
            onStatusChange={handleStatusChange}
          />
        </div>
        <span className="block px-1 text-center text-[10px] tabular-nums text-zinc-400">
          {formatEffort(row.effort) || "—"}
        </span>
        <WbsMetaCell value={row.notes} />

        <div className="flex justify-end pr-1">
          <WbsRowActions
            nodeId={row.id}
            rowName={row.name}
            hasNotes={(() => {
              const taskNode = findNode(root, row.id);
              return taskNode ? hasTaskMeta(taskNode) : false;
            })()}
            isActive={isAddingHere}
            canAddChild={row.canAddChild}
            onOpenTask={onOpenTask}
            onAddChild={() => onStartAdd("child", row.id)}
            onAddSibling={() => onStartAdd("sibling", row.id)}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {isAddingHere && pendingAdd && pendingAdd.mode !== "top" && (
        <WbsAddForm
          mode={pendingAdd.mode}
          depth={row.depth}
          onSubmit={handleAddSubmit}
          onCancel={onCancelAdd}
        />
      )}
    </Fragment>
  );
}

export function WbsGanttBoard({ root, onChange, onOpenTask }: WbsGanttBoardProps) {
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const rows = useMemo(() => flattenWbsBoard(root, collapsedIds), [root, collapsedIds]);
  const timeline = useMemo(() => buildGanttTimeline(root), [root]);
  const { containerRef, splitRatio, isResizing, startPanelStyle, startResize } = useResizableSplit({
    storageKey: WBS_GANTT_SPLIT_STORAGE_KEY,
    defaultRatio: WBS_GANTT_DEFAULT_SPLIT_RATIO,
    minStartPx: WBS_TABLE_MIN_WIDTH,
    minEndPx: 160,
  });

  const canDropInsideById = useMemo(() => {
    if (!dragSourceId) {
      return new Map<string, boolean>();
    }

    return new Map(
      rows.map((row) => [row.id, canDropNode(root, dragSourceId, row.id, "inside")]),
    );
  }, [dragSourceId, root, rows]);

  const handleDragStart = (nodeId: string) => {
    setDragSourceId(nodeId);
  };

  const handleDragEnd = () => {
    setDragSourceId(null);
    setDropTarget(null);
  };

  const handleDragOverRow = (targetId: string, position: DropPosition) => {
    if (!dragSourceId || dragSourceId === targetId) {
      setDropTarget(null);
      return;
    }

    if (!canDropNode(root, dragSourceId, targetId, position)) {
      setDropTarget(null);
      return;
    }

    setDropTarget({ id: targetId, position });
  };

  const handleDropRow = (targetId: string, position: DropPosition) => {
    if (!dragSourceId || dragSourceId === targetId) {
      handleDragEnd();
      return;
    }

    if (!canDropNode(root, dragSourceId, targetId, position)) {
      handleDragEnd();
      return;
    }

    onChange(moveNode(root, dragSourceId, targetId, position));

    if (position === "inside") {
      setCollapsedIds((current) => {
        const next = new Set(current);
        next.delete(targetId);
        return next;
      });
    }

    handleDragEnd();
  };

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleCollapseAll = () => {
    const next = new Set<string>();
    for (const child of root.children) {
      if (child.children.length > 0) {
        next.add(child.id);
      }
    }
    setCollapsedIds(next);
  };

  const handleExpandAll = () => {
    setCollapsedIds(new Set());
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

      <div
        ref={containerRef}
        className={`flex min-w-0 ${isResizing ? "select-none" : ""}`}
      >
        <div
          style={startPanelStyle}
          className="flex min-w-0 flex-col overflow-x-auto bg-zinc-950"
        >
          <WbsTableHeader />

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
              onSubmit={handleTopAddSubmit}
              onCancel={() => setPendingAdd(null)}
            />
          )}

          {rows.map((row, index) => (
            <WbsRowLeft
              key={row.id}
              row={row}
              rowIndex={index}
              root={root}
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
                  left:
                    timeline.days.findIndex((day) => day.isToday) * GANTT_DAY_COLUMN_WIDTH,
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
              const bar = getGanttBarRender(row.startDate, row.endDate, row.status, timeline);
              const isDropTarget = dropTarget?.id === row.id;
              const dropPosition = isDropTarget ? dropTarget.position : null;
              const node = findNode(root, row.id);

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
        WBS表の各列をクリックして詳細を編集できます（↗ ボタン）。ガントは右側で期間を確認できます。
      </p>
    </div>
  );
}
