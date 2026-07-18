"use client";

import { useMemo, useState } from "react";

import { GanttCalendarHeader, GanttCalendarRow } from "@/components/gantt-calendar";
import { ChevronDownIcon, ChevronRightIcon } from "@/components/icons";
import { WbsStatusBadge } from "@/components/wbs-status-badge";
import type { WbsGanttBoardProps } from "@/components/wbs-gantt/types";
import { buildGanttTimeline, getGanttBarRender } from "@/lib/gantt-utils";
import { computeNodeProgress } from "@/lib/task-progress";
import { formatTableDate } from "@/lib/wbs-task-meta";
import { findNode, flattenWbsBoard } from "@/lib/wbs";

type WbsMobileBoardProps = Pick<
  WbsGanttBoardProps,
  "root" | "onOpenTask" | "assigneeOptions"
> & {
  collapsedIds: Set<string>;
  onToggleCollapse: (nodeId: string) => void;
};

export function WbsMobileBoard({
  root,
  onOpenTask,
  collapsedIds,
  onToggleCollapse,
}: WbsMobileBoardProps) {
  const [showGantt, setShowGantt] = useState(false);
  const rows = useMemo(() => flattenWbsBoard(root, collapsedIds), [root, collapsedIds]);
  const timeline = useMemo(() => buildGanttTimeline(root), [root]);

  return (
    <div className="md:hidden">
      <p className="border-b border-zinc-800 bg-zinc-950 px-4 py-2 text-xs text-zinc-500">
        モバイル簡易ビュー — 行をタップして詳細を編集。並び替えはデスクトップ向けです。
      </p>

      <ul className="divide-y divide-zinc-800">
        {rows.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-zinc-500">まだ作業項目がありません</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className="flex items-start gap-1 px-2 py-1">
              {row.hasChildren ? (
                <button
                  type="button"
                  aria-label={row.isCollapsed ? `${row.name} を展開` : `${row.name} を折りたたむ`}
                  onClick={() => onToggleCollapse(row.id)}
                  className="mt-2 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500"
                >
                  {row.isCollapsed ? (
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDownIcon className="h-3.5 w-3.5" />
                  )}
                </button>
              ) : (
                <span className="w-5 shrink-0" aria-hidden="true" />
              )}

              <button
                type="button"
                onClick={() => onOpenTask(row.id)}
                className="min-w-0 flex-1 rounded-md px-2 py-2 text-left transition hover:bg-zinc-900/60"
                style={{ marginLeft: row.depth * 10 }}
              >
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[11px] text-zinc-500">{row.code}</span>
                  <WbsStatusBadge status={row.status} compact />
                </span>
                <span className="mt-1 block truncate text-sm font-medium text-zinc-100">
                  {row.name}
                </span>
                <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                  <span>{row.assignee?.trim() || "未割当"}</span>
                  {(row.startDate || row.endDate) && (
                    <span>
                      {formatTableDate(row.startDate)} – {formatTableDate(row.endDate)}
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))
        )}
      </ul>

      {rows.length > 0 && (
        <div className="border-t border-zinc-800 bg-zinc-950">
          <button
            type="button"
            aria-expanded={showGantt}
            onClick={() => setShowGantt((current) => !current)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-zinc-400"
          >
            <span>ガント（閲覧のみ）</span>
            {showGantt ? (
              <ChevronDownIcon className="h-4 w-4" />
            ) : (
              <ChevronRightIcon className="h-4 w-4" />
            )}
          </button>

          {showGantt && (
            <div className="overflow-x-auto overscroll-x-contain border-t border-zinc-800 bg-zinc-950/80">
              <div className="relative" style={{ width: timeline.chartWidthPx }}>
                <GanttCalendarHeader timeline={timeline} />
                {rows.map((row) => {
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

                  return (
                    <GanttCalendarRow
                      key={row.id}
                      row={row}
                      node={node}
                      timeline={timeline}
                      bar={bar}
                      rowChromeClass=""
                      isDragging={false}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => event.preventDefault()}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
