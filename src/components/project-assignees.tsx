"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { DeleteIcon, PlusIcon } from "@/components/icons";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { listAccounts } from "@/lib/account-store";
import {
  addProjectAssignee,
  countWbsNodesWithAssignee,
  removeProjectAssignee,
} from "@/lib/project-assignees";
import { getProject, saveProject } from "@/lib/project-store";
import { touchProject } from "@/lib/wbs";
import type { Account } from "@/types/account";
import type { ProjectAssignee, WbsProject } from "@/types/wbs";

type ProjectAssigneesProps = {
  projectId: string;
};

const inputClassName =
  "w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-600";

export function ProjectAssignees({ projectId }: ProjectAssigneesProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [project, setProject] = useState<WbsProject | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [manualName, setManualName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    const [loadedProject, loadedAccounts] = await Promise.all([
      getProject(projectId),
      listAccounts(),
    ]);

    if (!loadedProject) {
      router.replace("/");
      return false;
    }

    setProject(loadedProject);
    setAccounts(loadedAccounts);
    return true;
  }, [projectId, router]);

  useEffect(() => {
    void (async () => {
      const ok = await refresh();
      if (ok) {
        setIsReady(true);
      }
    })();
  }, [refresh]);

  const availableAccounts = useMemo(() => {
    if (!project) {
      return accounts;
    }

    const linkedIds = new Set(
      project.assignees.map((assignee) => assignee.accountId).filter(Boolean),
    );

    return accounts.filter((account) => !linkedIds.has(account.id));
  }, [accounts, project]);

  const persistProject = async (nextProject: WbsProject) => {
    const saved = touchProject(nextProject);
    await saveProject(saved);
    setProject(saved);
  };

  const handleAddFromAccount = async () => {
    if (!project || !selectedAccountId) {
      setError("追加するアカウントを選択してください。");
      return;
    }

    const account = accounts.find((item) => item.id === selectedAccountId);
    if (!account) {
      return;
    }

    const result = addProjectAssignee(project, {
      name: account.displayName,
      accountId: account.id,
    });

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setSelectedAccountId("");
    await persistProject(result.project);
  };

  const handleAddManual = async () => {
    if (!project) {
      return;
    }

    const result = addProjectAssignee(project, { name: manualName });

    if (result.error) {
      setError(result.error);
      return;
    }

    setError(null);
    setManualName("");
    await persistProject(result.project);
  };

  const handleRemove = async (assignee: ProjectAssignee) => {
    if (!project) {
      return;
    }

    const usageCount = countWbsNodesWithAssignee(project.root, assignee.name);
    const description =
      usageCount > 0
        ? `「${assignee.name}」を削除します。WBS 上の ${usageCount} 件の割り当てはそのまま残ります。`
        : `「${assignee.name}」を削除します。この操作は取り消せません。`;

    const confirmed = await confirm({
      title: "担当者の削除",
      description,
      confirmLabel: "削除",
      tone: "danger",
    });

    if (!confirmed) {
      return;
    }

    setError(null);
    await persistProject(removeProjectAssignee(project, assignee.id));
  };

  if (!project) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-8">
        <p className="text-sm text-zinc-500">プロジェクト</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">担当者管理</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          「{project.name}」で WBS に割り当て可能な担当者を登録します。ここに追加した担当者だけが WBS
          一覧・詳細パネルで選択できます。
        </p>
      </header>

      <section className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-medium text-white">アカウントマスターから追加</h2>
          <p className="mt-1 text-xs text-zinc-500">
            登録済みアカウントをこのプロジェクトの担当者候補に追加します。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              value={selectedAccountId}
              onChange={(event) => setSelectedAccountId(event.target.value)}
              className={inputClassName}
            >
              <option value="">アカウントを選択</option>
              {availableAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.displayName}
                  {account.department ? `（${account.department}）` : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void handleAddFromAccount()}
              disabled={!selectedAccountId}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              追加
            </button>
          </div>
          {availableAccounts.length === 0 && (
            <p className="mt-3 text-xs text-zinc-500">
              追加できるアカウントがありません。
              <Link href="/account/new" className="ml-1 text-zinc-300 underline">
                アカウントを作成
              </Link>
            </p>
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-medium text-white">名前を直接追加</h2>
          <p className="mt-1 text-xs text-zinc-500">
            アカウントマスターにない担当者も、表示名だけ登録できます。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={manualName}
              onChange={(event) => setManualName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAddManual();
                }
              }}
              placeholder="例: 山田太郎"
              className={inputClassName}
            />
            <button
              type="button"
              onClick={() => void handleAddManual()}
              disabled={!manualName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
            >
              <PlusIcon className="h-4 w-4" />
              追加
            </button>
          </div>
        </div>
      </section>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900/50 bg-red-950/20 px-4 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        {!isReady ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : project.assignees.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-zinc-400">まだ担当者が登録されていません。</p>
            <p className="mt-2 text-xs text-zinc-600">
              上のフォームから追加すると、WBS で選択できるようになります。
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-black/40 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">担当者名</th>
                  <th className="px-4 py-3">アカウント連携</th>
                  <th className="px-4 py-3">WBS 割当数</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {project.assignees.map((assignee) => {
                  const linkedAccount = assignee.accountId
                    ? accounts.find((account) => account.id === assignee.accountId)
                    : null;

                  return (
                    <tr key={assignee.id} className="transition hover:bg-zinc-900/50">
                      <td className="px-4 py-3 font-medium text-zinc-100">{assignee.name}</td>
                      <td className="px-4 py-3 text-zinc-500">
                        {linkedAccount ? (
                          <span>
                            {linkedAccount.email || linkedAccount.displayName}
                            {linkedAccount.department ? ` / ${linkedAccount.department}` : ""}
                          </span>
                        ) : (
                          <span className="text-zinc-600">手動追加</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-zinc-400">
                        {countWbsNodesWithAssignee(project.root, assignee.name)} 件
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => void handleRemove(assignee)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-300"
                          >
                            <DeleteIcon className="h-3.5 w-3.5" />
                            削除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-zinc-600">
        グローバルなアカウント管理は{" "}
        <Link href="/account" className="text-zinc-400 underline">
          アカウントマスター
        </Link>
        、WBS への割り当ては{" "}
        <Link href={`/projects/${projectId}/wbs`} className="text-zinc-400 underline">
          WBS 画面
        </Link>
        から行えます。
      </p>
    </div>
  );
}
