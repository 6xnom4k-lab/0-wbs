"use client";

import type { AccountInput } from "@/types/account";

type AccountFormProps = {
  initialValues: AccountInput;
  submitLabel: string;
  onSubmit: (values: AccountInput) => void;
  onCancel?: () => void;
};

const inputClassName =
  "w-full rounded-xl border border-zinc-300 bg-white px-4 py-3.5 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20";

export function AccountForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    onSubmit({
      displayName: String(formData.get("displayName") ?? ""),
      email: String(formData.get("email") ?? ""),
      department: String(formData.get("department") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">表示名</span>
        <input
          name="displayName"
          autoFocus
          defaultValue={initialValues.displayName}
          placeholder="例: 山田 太郎"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          メールアドレス
        </span>
        <input
          name="email"
          type="email"
          defaultValue={initialValues.email}
          placeholder="例: taro@example.com"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">部署</span>
        <input
          name="department"
          defaultValue={initialValues.department}
          placeholder="例: プロダクト開発部"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">役職</span>
        <input
          name="role"
          defaultValue={initialValues.role}
          placeholder="例: プロジェクトマネージャー"
          className={inputClassName}
        />
      </label>

      <label className="flex flex-col gap-2 opacity-60">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          権限
          <span className="ml-2 text-xs font-normal text-zinc-500">準備中</span>
        </span>
        <select
          disabled
          className="w-full cursor-not-allowed rounded-xl border border-zinc-200 bg-zinc-100 px-4 py-3.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-500"
        >
          <option>未設定</option>
        </select>
      </label>

      <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 pt-6 sm:flex-row sm:justify-end dark:border-zinc-800">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
