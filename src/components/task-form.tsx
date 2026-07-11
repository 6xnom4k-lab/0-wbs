"use client";

import type { TaskInput } from "@/types/task";

import { TASK_PRIORITY_OPTIONS } from "@/lib/task-utils";

type TaskFormProps = {
  initialValues: TaskInput;
  categorySuggestions: string[];
  submitLabel: string;
  onSubmit: (values: TaskInput) => void;
  onCancel?: () => void;
};

const inputClassName =
  "w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-600";

export function TaskForm({
  initialValues,
  categorySuggestions,
  submitLabel,
  onSubmit,
  onCancel,
}: TaskFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      category: String(formData.get("category") ?? ""),
      title: String(formData.get("title") ?? ""),
      detail: String(formData.get("detail") ?? ""),
      priority: String(formData.get("priority") ?? "medium") as TaskInput["priority"],
      startDate: String(formData.get("startDate") ?? ""),
      endDate: String(formData.get("endDate") ?? ""),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
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
          defaultValue={initialValues.title}
          placeholder="例: ヒアリング実施"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 md:col-span-2">
        <span className="text-sm font-medium text-zinc-300">詳細</span>
        <textarea
          name="detail"
          rows={3}
          defaultValue={initialValues.detail}
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
