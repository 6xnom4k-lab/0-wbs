"use client";

import { GoogleCalendarButton } from "@/components/google-calendar-button";
import { TaskProgressEditor } from "@/components/task-progress-bar";
import { inputClassName } from "@/components/ui/input";
import { WBS_STATUS_OPTIONS } from "@/lib/wbs-task-meta";
import type { WbsTaskStatus } from "@/types/wbs";

export type TaskDetailFieldsProps = {
  expanded?: boolean;
  assigneeOptions: string[];
  assignee: string;
  onAssigneeChange: (value: string) => void;
  assigneeDisabled?: boolean;
  assigneeHelpText?: string;
  status: WbsTaskStatus;
  onStatusChange: (status: WbsTaskStatus) => void;
  progressPercent?: number;
  progressReadOnly?: boolean;
  isRollup?: boolean;
  onProgressChange?: (progress: number, status: WbsTaskStatus) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  scheduledAt: string;
  scheduledEndAt: string;
  onScheduledAtChange: (value: string) => void;
  onScheduledEndAtChange: (value: string) => void;
  scheduleLabel?: string;
  scheduledLabel?: string;
  calendarTitle?: string;
  calendarDescription?: string;
  showEffort?: boolean;
  effort?: string;
  onEffortChange?: (value: string) => void;
};

export function TaskDetailFields({
  expanded = false,
  assigneeOptions,
  assignee,
  onAssigneeChange,
  assigneeDisabled = false,
  assigneeHelpText,
  status,
  onStatusChange,
  progressPercent,
  progressReadOnly = false,
  isRollup = false,
  onProgressChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  scheduledAt,
  scheduledEndAt,
  onScheduledAtChange,
  onScheduledEndAtChange,
  scheduleLabel,
  scheduledLabel,
  calendarTitle,
  calendarDescription,
  showEffort = false,
  effort = "",
  onEffortChange,
}: TaskDetailFieldsProps) {
  return (
    <div className={`grid gap-3 ${expanded ? "md:grid-cols-2" : ""}`}>
      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">ステータス</span>
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as WbsTaskStatus)}
          className={inputClassName}
        >
          {WBS_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1.5 md:col-span-2">
        <span className="text-xs text-zinc-500">進捗率</span>
        <TaskProgressEditor
          progressPercent={progressPercent}
          status={status}
          readOnly={progressReadOnly}
          isRollup={isRollup}
          onChange={onProgressChange}
        />
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">担当者</span>
        {assigneeOptions.length > 0 ? (
          <select
            value={assignee}
            onChange={(event) => onAssigneeChange(event.target.value)}
            className={inputClassName}
          >
            <option value="">未割当</option>
            {assigneeOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              value={assignee}
              onChange={(event) => onAssigneeChange(event.target.value)}
              placeholder="担当者管理で候補を追加してください"
              className={inputClassName}
              disabled={assigneeDisabled}
            />
            {assigneeHelpText && (
              <p className="text-[11px] text-zinc-600">{assigneeHelpText}</p>
            )}
          </>
        )}
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">開始日</span>
        <input
          type="date"
          value={startDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">終了日</span>
        <input
          type="date"
          value={endDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className={inputClassName}
        />
      </label>

      {showEffort && onEffortChange && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-zinc-500">作業工数</span>
          <input
            type="number"
            min={0}
            step={0.5}
            value={effort}
            onChange={(event) => onEffortChange(event.target.value)}
            placeholder="例: 3"
            className={inputClassName}
          />
        </label>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">対応予定日時</span>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(event) => onScheduledAtChange(event.target.value)}
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs text-zinc-500">対応予定終了日時</span>
        <input
          type="datetime-local"
          value={scheduledEndAt}
          onChange={(event) => onScheduledEndAtChange(event.target.value)}
          className={inputClassName}
        />
      </label>

      {scheduleLabel && (
        <p className="text-xs text-zinc-500 md:col-span-2">対応期間: {scheduleLabel}</p>
      )}

      {scheduledLabel && (
        <p className="text-xs text-zinc-500 md:col-span-2">対応予定: {scheduledLabel}</p>
      )}

      {scheduledAt && calendarTitle && (
        <div className="md:col-span-2">
          <GoogleCalendarButton
            title={calendarTitle}
            startAt={scheduledAt}
            endAt={scheduledEndAt || undefined}
            description={calendarDescription}
          />
          <p className="mt-2 text-[11px] text-zinc-600">
            終了日時が未設定の場合、Googleカレンダーでは1時間の予定として追加されます。
          </p>
        </div>
      )}
    </div>
  );
}
