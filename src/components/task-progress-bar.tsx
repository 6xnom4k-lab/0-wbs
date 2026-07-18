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
};

export function TaskProgressSummary({ stats }: TaskProgressSummaryProps) {
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
        <span className="rounded-full bg-sky-950/50 px-2 py-0.5 text-sky-300 ring-1 ring-inset ring-sky-900/60">
          進行中 {stats.inProgress}
        </span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300 ring-1 ring-inset ring-zinc-700">
          未着手 {stats.notStarted}
        </span>
        <span className="rounded-full bg-emerald-950/50 px-2 py-0.5 text-emerald-300 ring-1 ring-inset ring-emerald-900/60">
          完了 {stats.done}
        </span>
        <span className="rounded-full bg-amber-950/50 px-2 py-0.5 text-amber-300 ring-1 ring-inset ring-amber-900/60">
          保留 {stats.onHold}
        </span>
        {stats.overdue > 0 && (
          <span className="rounded-full bg-red-950/50 px-2 py-0.5 text-red-300 ring-1 ring-inset ring-red-900/60">
            期限超過 {stats.overdue}
          </span>
        )}
      </div>
    </div>
  );
}
