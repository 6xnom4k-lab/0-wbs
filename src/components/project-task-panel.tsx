"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ExpandFullscreenIcon, ShrinkPanelIcon } from "@/components/icons";
import { TaskDetailFields } from "@/components/task-detail-fields";
import { WbsStatusBadge } from "@/components/wbs-status-badge";
import { formatWbsNodeLabel } from "@/lib/unified-tasks";
import { updateProjectTask } from "@/lib/task-store";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-utils";
import { formatScheduledRange } from "@/lib/google-calendar";
import { syncProgressWithStatus } from "@/lib/task-progress";
import type { ProjectTask, TaskInput } from "@/types/task";
import type { WbsProject } from "@/types/wbs";

type ProjectTaskPanelProps = {
  taskId: string;
  project: WbsProject;
  task: ProjectTask;
  onTaskChange: (task: ProjectTask) => void;
  onClose: () => void;
};

type TaskDraft = TaskInput & {
  title: string;
};

const fieldClassName =
  "w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600";

function taskToDraft(task: ProjectTask): TaskDraft {
  return {
    category: task.category,
    title: task.title,
    detail: task.detail,
    notes: task.notes,
    content: task.content,
    assignee: task.assignee,
    wbsNodeId: task.wbsNodeId,
    status: task.status,
    progressPercent: task.progressPercent,
    priority: task.priority,
    startDate: task.startDate,
    endDate: task.endDate,
    scheduledAt: task.scheduledAt,
    scheduledEndAt: task.scheduledEndAt,
    googleCalendarEventUrl: task.googleCalendarEventUrl,
  };
}

function draftToInput(draft: TaskDraft): TaskInput {
  return {
    category: draft.category.trim(),
    title: draft.title.trim(),
    detail: draft.detail.trim(),
    notes: draft.notes.trim(),
    content: draft.content,
    assignee: draft.assignee.trim(),
    wbsNodeId: draft.wbsNodeId.trim(),
    status: draft.status,
    progressPercent: draft.progressPercent,
    priority: draft.priority,
    startDate: draft.startDate,
    endDate: draft.endDate,
    scheduledAt: draft.scheduledAt,
    scheduledEndAt: draft.scheduledEndAt,
    googleCalendarEventUrl: draft.googleCalendarEventUrl,
  };
}

export function ProjectTaskPanel({
  taskId,
  project,
  task,
  onTaskChange,
  onClose,
}: ProjectTaskPanelProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [draft, setDraft] = useState<TaskDraft>(() => taskToDraft(task));
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const saveTimerRef = useRef<number | null>(null);
  const draftRef = useRef(draft);
  const taskIdRef = useRef(taskId);

  draftRef.current = draft;
  taskIdRef.current = taskId;

  const wbsLabel = useMemo(
    () => (draft.wbsNodeId ? formatWbsNodeLabel(project.root, draft.wbsNodeId) : ""),
    [draft.wbsNodeId, project.root],
  );

  const scheduledLabel = formatScheduledRange(draft.scheduledAt, draft.scheduledEndAt);
  const contentMinHeight = expanded ? "min-h-[50vh]" : "min-h-[160px]";

  useEffect(() => {
    setMounted(true);
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setDraft(taskToDraft(task));
    setSaveState("idle");
  }, [task]);

  const persistDraft = useCallback(async () => {
    const input = draftToInput(draftRef.current);
    if (!input.title) {
      return;
    }

    setSaveState("saving");
    const updated = await updateProjectTask(project.id, taskIdRef.current, input);
    if (updated) {
      onTaskChange(updated);
      setSaveState("saved");
    } else {
      setSaveState("idle");
    }
  }, [onTaskChange, project.id]);

  const flushDraft = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    void persistDraft();
  }, [persistDraft]);

  useEffect(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistDraft();
    }, 400);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [draft, persistDraft]);

  useEffect(() => {
    return () => {
      void persistDraft();
    };
  }, [persistDraft]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        flushDraft();
        setVisible(false);
        window.setTimeout(onClose, 220);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flushDraft, onClose]);

  const handleClose = () => {
    flushDraft();
    setVisible(false);
    window.setTimeout(onClose, 220);
  };

  const updateDraft = (partial: Partial<TaskDraft>) => {
    setSaveState("idle");
    setDraft((current) => ({ ...current, ...partial }));
  };

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${expanded ? "" : "justify-end"}`}>
      {!expanded && (
        <button
          type="button"
          aria-label="パネルを閉じる"
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleClose}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={draft.title}
        onMouseDown={(event) => event.stopPropagation()}
        className={`relative flex h-full flex-col bg-zinc-950 transition-all duration-300 ease-out ${
          visible ? "translate-x-0" : "translate-x-full"
        } ${
          expanded
            ? "w-full border-0"
            : "w-[30vw] min-w-[320px] max-w-[520px] border-l border-zinc-800 shadow-2xl"
        }`}
      >
        <header
          className={`shrink-0 border-b border-zinc-800 ${
            expanded ? "bg-zinc-950/95 px-8 py-4 backdrop-blur-sm" : "px-5 py-4"
          }`}
        >
          <div className="mx-auto flex max-w-4xl items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500">
                <span className="rounded-full border border-violet-900/60 bg-violet-950/40 px-2 py-0.5 text-violet-300">
                  追加タスク
                </span>
                {draft.category && <span>{draft.category}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <WbsStatusBadge status={draft.status} />
                <span className="rounded-full border border-zinc-800 bg-black px-2 py-0.5 text-[11px] text-zinc-500">
                  優先度: {TASK_PRIORITY_OPTIONS.find((o) => o.value === draft.priority)?.label}
                </span>
              </div>
              <input
                value={draft.title}
                onChange={(event) => updateDraft({ title: event.target.value })}
                className={`w-full bg-transparent font-semibold leading-snug text-white outline-none ${
                  expanded ? "text-2xl" : "text-lg"
                }`}
              />
              {wbsLabel && (
                <p className="text-xs text-zinc-500">WBS: {wbsLabel}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-label={expanded ? "サイドパネルに戻す" : "全画面表示"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                {expanded ? (
                  <ShrinkPanelIcon className="h-4 w-4" />
                ) : (
                  <ExpandFullscreenIcon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label="閉じる"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-900 hover:text-zinc-200"
              >
                ✕
              </button>
            </div>
          </div>
        </header>

        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto py-4 ${expanded ? "px-8" : "px-5"}`}>
          <div className="mx-auto w-full max-w-4xl space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-zinc-300">基本情報</h3>
                <span className="text-xs text-zinc-600">
                  {saveState === "saving" && "保存中..."}
                  {saveState === "saved" && "保存済み"}
                </span>
              </div>

              <label className="flex flex-col gap-1.5 md:col-span-2">
                <span className="text-xs text-zinc-500">詳細</span>
                <textarea
                  value={draft.detail}
                  onChange={(event) => updateDraft({ detail: event.target.value })}
                  rows={3}
                  placeholder="タスクの概要や目的..."
                  className={`${fieldClassName} resize-y leading-6`}
                />
              </label>

              <TaskDetailFields
                expanded={expanded}
                assigneeOptions={project.assignees.map((assignee) => assignee.name)}
                assignee={draft.assignee}
                onAssigneeChange={(assignee) => updateDraft({ assignee })}
                status={draft.status}
                onStatusChange={(nextStatus) => {
                  const nextProgress = syncProgressWithStatus(nextStatus, draft.progressPercent);
                  updateDraft({
                    status: nextStatus,
                    progressPercent: nextProgress,
                  });
                }}
                progressPercent={draft.progressPercent}
                onProgressChange={(nextProgress, nextStatus) =>
                  updateDraft({
                    progressPercent: nextProgress,
                    status: nextStatus,
                  })
                }
                startDate={draft.startDate}
                endDate={draft.endDate}
                onStartDateChange={(startDate) => updateDraft({ startDate })}
                onEndDateChange={(endDate) => updateDraft({ endDate })}
                scheduledAt={draft.scheduledAt}
                scheduledEndAt={draft.scheduledEndAt}
                onScheduledAtChange={(scheduledAt) => updateDraft({ scheduledAt })}
                onScheduledEndAtChange={(scheduledEndAt) => updateDraft({ scheduledEndAt })}
                scheduledLabel={scheduledLabel}
                calendarTitle={draft.title || "タスク"}
                calendarDescription={draft.detail}
              />
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-medium text-zinc-300">備考</h3>
              <textarea
                value={draft.notes}
                onChange={(event) => updateDraft({ notes: event.target.value })}
                rows={3}
                placeholder="補足メモ..."
                className={`${fieldClassName} resize-y leading-6`}
              />
            </section>

            <section className="space-y-2">
              <div>
                <h3 className="text-sm font-medium text-zinc-300">作業記録</h3>
                <p className="mt-1 text-xs text-zinc-600">
                  作業ログや調査結果など、長文の記録を残せます。
                </p>
              </div>
              <textarea
                value={draft.content}
                onChange={(event) => updateDraft({ content: event.target.value })}
                placeholder="作業内容を記録..."
                className={`${contentMinHeight} w-full resize-y rounded-lg border border-zinc-800 bg-black px-4 py-3 font-mono text-sm leading-7 text-zinc-100 outline-none transition focus:border-zinc-600`}
              />
            </section>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
