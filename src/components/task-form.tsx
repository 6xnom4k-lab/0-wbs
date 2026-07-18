"use client";

import { useState } from "react";

import type { TaskInput } from "@/types/task";

import { GoogleCalendarButton } from "@/components/google-calendar-button";
import { TaskProgressEditor } from "@/components/task-progress-bar";
import type { AssigneeSuggestion } from "@/lib/assignee-suggestions";
import type { WbsNodeOption } from "@/lib/unified-tasks";
import { TASK_PRIORITY_OPTIONS } from "@/lib/task-utils";
import { WBS_STATUS_OPTIONS } from "@/lib/wbs-task-meta";
import { syncProgressWithStatus } from "@/lib/task-progress";

type TaskFormProps = {
  initialValues: TaskInput;
  categorySuggestions: string[];
  assigneeSuggestions: string[];
  assigneeSuggestionDetails?: AssigneeSuggestion[];
  wbsNodeOptions: WbsNodeOption[];
  submitLabel: string;
  onSubmit: (values: TaskInput) => void;
  onCancel?: () => void;
};

const inputClassName =
  "w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-600";

export function TaskForm({
  initialValues,
  categorySuggestions,
  assigneeSuggestions,
  assigneeSuggestionDetails = [],
  wbsNodeOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const [title, setTitle] = useState(initialValues.title);
  const [detail, setDetail] = useState(initialValues.detail);
  const [assignee, setAssignee] = useState(initialValues.assignee);
  const [scheduledAt, setScheduledAt] = useState(initialValues.scheduledAt);
  const [scheduledEndAt, setScheduledEndAt] = useState(initialValues.scheduledEndAt);
  const [wbsNodeId, setWbsNodeId] = useState(initialValues.wbsNodeId);
  const [status, setStatus] = useState(initialValues.status);
  const [progressPercent, setProgressPercent] = useState<number | undefined>(
    initialValues.progressPercent,
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      category: String(formData.get("category") ?? ""),
      title: String(formData.get("title") ?? ""),
      detail: String(formData.get("detail") ?? ""),
      notes: initialValues.notes,
      content: initialValues.content,
      assignee: String(formData.get("assignee") ?? ""),
      wbsNodeId: String(formData.get("wbsNodeId") ?? ""),
      status,
      progressPercent,
      priority: String(formData.get("priority") ?? "medium") as TaskInput["priority"],
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
      scheduledAt: String(formData.get("scheduledAt") ?? ""),
      scheduledEndAt: String(formData.get("scheduledEndAt") ?? ""),
      googleCalendarEventUrl: initialValues.googleCalendarEventUrl,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-zinc-300">WBS 割り当て</span>
        <select
          name="wbsNodeId"
          value={wbsNodeId}
          onChange={(event) => setWbsNodeId(event.target.value)}
          className={inputClassName}
        >
          <option value="">未割当（WBS に紐づけない）</option>
          {wbsNodeOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="text-xs text-zinc-500">
          WBS のどの作業項目に紐づくタスクかを指定できます。
        </span>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">担当者</span>
        {assigneeSuggestionDetails.some((item) => item.source === "project") ? (
          <select
            name="assignee"
            value={assignee}
            onChange={(event) => setAssignee(event.target.value)}
            className={inputClassName}
          >
            <option value="">未割当</option>
            <optgroup label="プロジェクト担当者">
              {assigneeSuggestionDetails
                .filter((item) => item.source === "project")
                .map((item) => (
                  <option key={`project-${item.name}`} value={item.name}>
                    {item.name}
                    {item.hint ? `（${item.hint}）` : ""}
                  </option>
                ))}
            </optgroup>
            {assigneeSuggestionDetails.some((item) => item.source === "account") && (
              <optgroup label="アカウントマスター">
                {assigneeSuggestionDetails
                  .filter((item) => item.source === "account")
                  .map((item) => (
                    <option key={`account-${item.name}`} value={item.name}>
                      {item.name}
                      {item.hint ? `（${item.hint}）` : ""}
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        ) : (
          <>
            <input
              name="assignee"
              list="task-assignee-suggestions"
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              placeholder="例: 山田太郎"
              className={inputClassName}
            />
            <datalist id="task-assignee-suggestions">
              {assigneeSuggestions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </>
        )}
        {assigneeSuggestionDetails.some((item) => item.source === "account") && (
          <span className="text-xs text-zinc-500">
            アカウントマスターの候補も表示しています。プロジェクト担当者への追加は担当者管理から行えます。
          </span>
        )}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">状態</span>
        <select
          value={status}
          onChange={(event) => {
            const nextStatus = event.target.value as TaskInput["status"];
            setStatus(nextStatus);
            setProgressPercent(syncProgressWithStatus(nextStatus, progressPercent));
          }}
          className={inputClassName}
        >
          {WBS_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-zinc-300">進捗率</span>
        <TaskProgressEditor
          progressPercent={progressPercent}
          status={status}
          onChange={(nextProgress, nextStatus) => {
            setProgressPercent(nextProgress);
            setStatus(nextStatus);
          }}
        />
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">大項目</span>
        <input
          name="category"
          list="task-category-suggestions"
          defaultValue={initialValues.category}
          placeholder="例: 要件定義"
          className={inputClassName}
        />
        <datalist id="task-category-suggestions">
          {categorySuggestions.map((category) => (
            <option key={category} value={category} />
          ))}
        </datalist>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">
          項目<span className="ml-1 text-red-400">*</span>
        </span>
        <input
          name="title"
          autoFocus
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="例: ヒアリング実施"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-zinc-300">詳細</span>
        <textarea
          name="detail"
          rows={3}
          value={detail}
          onChange={(event) => setDetail(event.target.value)}
          placeholder="タスクの詳細や補足を入力"
          className={`${inputClassName} resize-y`}
        />
      </label>

      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-zinc-300">優先度</span>
        <select
          name="priority"
          defaultValue={initialValues.priority}
          className={`${inputClassName} md:max-w-xs`}
        >
          {TASK_PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">対応開始日</span>
        <input
          name="startDate"
          type="date"
          defaultValue={initialValues.startDate}
          className={inputClassName}
        />
      </label>
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">対応終了日</span>
        <input
          name="endDate"
          type="date"
          defaultValue={initialValues.endDate}
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">対応予定日時</span>
        <input
          name="scheduledAt"
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => setScheduledAt(event.target.value)}
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-300">対応予定終了日時</span>
        <input
          name="scheduledEndAt"
          type="datetime-local"
          value={scheduledEndAt}
          onChange={(event) => setScheduledEndAt(event.target.value)}
          className={inputClassName}
        />
      </label>

      {scheduledAt && (
        <div className="md:col-span-2">
          <GoogleCalendarButton
            title={title || "WBS タスク"}
            startAt={scheduledAt}
            endAt={scheduledEndAt || undefined}
            description={detail}
          />
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 md:col-span-2 md:flex-row md:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-900"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
