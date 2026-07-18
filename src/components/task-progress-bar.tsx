"use client";

import {
  clampProgressPercent,
  resolveProgressPercent,
  syncStatusWithProgress,
} from "@/lib/task-progress";
import type { WbsTaskStatus } from "@/types/wbs";

type TaskProgressBarProps = {
  percent: number;
  compact?: boolean;
  className?: string;
};

export function TaskProgressBar({ percent, compact = false, className = "" }: TaskProgressBarProps) {
  const clamped = clampProgressPercent(percent);

  return (
    <div className={`flex min-w-0 items-center gap-1.5 ${className}`}>
      <div
        className={`relative min-w-0 flex-1 overflow-hidden rounded-full bg-zinc-800 ring-1 ring-inset ring-zinc-700/80 ${
          compact ? "h-1.5" : "h-2"
        }`}
      >
        <div
          className={`absolute inset-y-0 left-0 rounded-full ${
            clamped >= 100 ? "bg-emerald-500" : clamped > 0 ? "bg-sky-500" : "bg-transparent"
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`shrink-0 tabular-nums text-zinc-400 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        {clamped}%
      </span>
    </div>
  );
}

type TaskProgressEditorProps = {
  progressPercent?: number;
  status?: WbsTaskStatus;
  compact?: boolean;
  readOnly?: boolean;
  isRollup?: boolean;
  onChange?: (progressPercent: number, status: WbsTaskStatus) => void;
};

export function TaskProgressEditor({
  progressPercent,
  status = "not_started",
  compact = false,
  readOnly = false,
  isRollup = false,
  onChange,
}: TaskProgressEditorProps) {
  const displayPercent = resolveProgressPercent(progressPercent, status);

  if (readOnly || isRollup) {
    return (
      <div
        className="flex min-w-0 items-center gap-1 py-0.5"
        title={isRollup ? "配下項目から集計" : undefined}
      >
        <TaskProgressBar percent={displayPercent} compact={compact} className="flex-1" />
        {isRollup && (
          <span className="shrink-0 text-[9px] text-zinc-600">集計</span>
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-1.5 py-0.5">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={displayPercent}
          aria-label={`進捗率 ${displayPercent}%`}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => {
            const nextProgress = clampProgressPercent(Number(event.target.value));
            const nextStatus = syncStatusWithProgress(status, nextProgress);
            onChange?.(nextProgress, nextStatus);
          }}
          className="h-4 min-w-0 flex-1 cursor-pointer accent-sky-500"
        />
        <span className="w-7 shrink-0 text-right text-[10px] tabular-nums text-zinc-400">
          {displayPercent}%
        </span>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1.5">
      <TaskProgressBar percent={displayPercent} compact={compact} />
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={displayPercent}
        aria-label="進捗率"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          const nextProgress = clampProgressPercent(Number(event.target.value));
          const nextStatus = syncStatusWithProgress(status, nextProgress);
          onChange?.(nextProgress, nextStatus);
        }}
        className="h-4 w-full cursor-pointer accent-sky-500"
      />
    </div>
  );
}

type TaskProgressSummaryProps = {
  stats: {
    total: number;
    done: number;
    inProgress: number;
    notStarted: number;
    onHold: number;
    overdue: number;
    averageProgress: number;
  };
  onFilterClick?: (filter: "my_pending" | "not_started" | "in_progress" | "done" | "on_hold" | "overdue") => void;
  myPendingCount?: number;
};

function SummaryChip({
  label,
  count,
  className,
  onClick,
}: {
  label: string;
  count: number;
  className: string;
  onClick?: () => void;
}) {
  const Component = onClick ? "button" : "span";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`rounded-full px-2 py-0.5 ring-1 ring-inset ${className} ${
        onClick ? "cursor-pointer transition hover:brightness-110" : ""
      }`}
    >
      {label} {count}
    </Component>
  );
}

export function TaskProgressSummary({ stats, onFilterClick, myPendingCount = 0 }: TaskProgressSummaryProps) {
  if (stats.total === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-500">
        進行管理対象のタスクがありません。
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-zinc-500">全体進捗</p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {stats.averageProgress}%
            <span className="ml-2 text-sm font-normal text-zinc-500">
              完了 {stats.done}/{stats.total}
            </span>
          </p>
        </div>
        <div className="min-w-[160px] flex-1 sm:max-w-xs">
          <TaskProgressBar percent={stats.averageProgress} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        {myPendingCount > 0 && (
          <SummaryChip
            label="自分の未完了"
            count={myPendingCount}
            className="bg-violet-950/50 text-violet-300 ring-violet-900/60"
            onClick={onFilterClick ? () => onFilterClick("my_pending") : undefined}
          />
        )}
        <SummaryChip
          label="進行中"
          count={stats.inProgress}
          className="bg-sky-950/50 text-sky-300 ring-sky-900/60"
          onClick={onFilterClick ? () => onFilterClick("in_progress") : undefined}
        />
        <SummaryChip
          label="未着手"
          count={stats.notStarted}
          className="bg-zinc-800 text-zinc-300 ring-zinc-700"
          onClick={onFilterClick ? () => onFilterClick("not_started") : undefined}
        />
        <SummaryChip
          label="完了"
          count={stats.done}
          className="bg-emerald-950/50 text-emerald-300 ring-emerald-900/60"
          onClick={onFilterClick ? () => onFilterClick("done") : undefined}
        />
        <SummaryChip
          label="保留"
          count={stats.onHold}
          className="bg-amber-950/50 text-amber-300 ring-amber-900/60"
          onClick={onFilterClick ? () => onFilterClick("on_hold") : undefined}
        />
        {stats.overdue > 0 && (
          <SummaryChip
            label="期限超過"
            count={stats.overdue}
            className="bg-red-950/50 text-red-300 ring-red-900/60"
            onClick={onFilterClick ? () => onFilterClick("overdue") : undefined}
          />
        )}
      </div>
    </div>
  );
}
