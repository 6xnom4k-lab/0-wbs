"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ChevronDownIcon,
  DeleteIcon,
  ExternalLinkIcon,
  LayoutGridIcon,
  PlusIcon,
  SearchIcon,
  TableRowsIcon,
} from "@/components/icons";
import { IconButton } from "@/components/icon-button";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import {
  deleteProject as deleteStoredProject,
  listProjectSummaries,
  migrateLocalProjectsToSupabase,
  saveProject,
  usesSupabaseStorage,
} from "@/lib/project-store";
import { createProject } from "@/lib/wbs";
import { formatRelativeDateJa } from "@/lib/format-relative-date";
import type { WbsProjectSummary } from "@/types/wbs";

type ProjectViewMode = "card" | "table";

const VIEW_MODE_STORAGE_KEY = "0-wbs:project-view-mode";

function readStoredViewMode(): ProjectViewMode {
  if (typeof window === "undefined") {
    return "card";
  }

  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "table" ? "table" : "card";
}

export function ProjectList() {
  const router = useRouter();
  const confirm = useConfirm();
  const [projects, setProjects] = useState<WbsProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<ProjectViewMode>("card");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [enterArmed, setEnterArmed] = useState(false);

  const refreshProjects = async () => {
    try {
      setLoadError(null);
      setProjects(await listProjectSummaries());
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "プロジェクトの読み込みに失敗しました",
      );
    }
  };

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

  useEffect(() => {
    void refreshProjects().finally(() => setIsReady(true));
  }, []);

  const filteredProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return projects;
    }

    return projects.filter((project) =>
      project.name.toLowerCase().includes(normalizedQuery),
    );
  }, [projects, query]);

  const handleCreateProject = async () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      return;
    }

    const project = createProject(trimmed);
    await saveProject(project);
    setProjectName("");
    setEnterArmed(false);
    setIsCreateOpen(false);
    router.push(`/projects/${project.id}`);
  };

  const handleProjectNameChange = (value: string) => {
    setProjectName(value);
    setEnterArmed(false);
  };

  const handleCreateKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!projectName.trim()) {
        return;
      }
      if (!enterArmed) {
        setEnterArmed(true);
        return;
      }
      void handleCreateProject();
    }
    if (event.key === "Escape") {
      setEnterArmed(false);
      setIsCreateOpen(false);
    }
  };

  const handleDeleteProject = async (project: WbsProjectSummary) => {
    const confirmed = await confirm({
      title: "プロジェクトの削除",
      description: `「${project.name}」を削除します。この操作は取り消せません。`,
      confirmLabel: "削除",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    await deleteStoredProject(project.id);
    await refreshProjects();
  };

  const handleMigrateLocal = async () => {
    setIsMigrating(true);
    try {
      const count = await migrateLocalProjectsToSupabase();
      window.alert(`${count} 件のプロジェクトを Supabase に移行しました。`);
      await refreshProjects();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "移行に失敗しました");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleViewModeChange = (nextViewMode: ProjectViewMode) => {
    setViewMode(nextViewMode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextViewMode);
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">プロジェクト一覧</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">概要</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="プロジェクトを検索..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none transition focus:border-zinc-600"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreateOpen((open) => {
                if (open) {
                  setEnterArmed(false);
                }
                return !open;
              });
            }}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            新規作成
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {usesSupabaseStorage() && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs text-zinc-400">
          <span>以前ブラウザに保存したプロジェクトがある場合、Supabase へ移行できます。</span>
          <button
            type="button"
            onClick={() => void handleMigrateLocal()}
            disabled={isMigrating}
            className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-200 transition hover:bg-zinc-900 disabled:opacity-50"
          >
            {isMigrating ? "移行中..." : "localStorage から移行"}
          </button>
        </div>
      )}

      {isCreateOpen && (
        <section className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-medium text-white">新規プロジェクト</h2>
          <p className="mt-1 text-xs text-zinc-500">
            作成後、WBS 編集画面へ移動します。Enter は2回押すと作成されます。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              autoFocus
              value={projectName}
              onChange={(event) => handleProjectNameChange(event.target.value)}
              onKeyDown={handleCreateKeyDown}
              placeholder="例: 新商品開発プロジェクト"
              className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
            <button
              type="button"
              onClick={() => void handleCreateProject()}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              作成して WBS を編集
            </button>
          </div>
          {enterArmed && projectName.trim() && (
            <p className="mt-2 text-xs text-amber-400/90">
              もう一度 Enter で作成します
            </p>
          )}
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-400">プロジェクト</h2>
            <span className="text-xs text-zinc-600">{filteredProjects.length} 件</span>
          </div>

          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
            options={[
              {
                value: "card",
                label: "カード表示",
                icon: <LayoutGridIcon />,
              },
              {
                value: "table",
                label: "表表示",
                icon: <TableRowsIcon />,
              },
            ]}
          />
        </div>

        {!isReady ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center text-sm text-zinc-500">
            読み込み中...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
            <p className="text-sm text-zinc-400">
              {projects.length === 0
                ? "まだプロジェクトがありません"
                : "検索条件に一致するプロジェクトがありません"}
            </p>
            {projects.length === 0 && (
              <button
                type="button"
                onClick={() => {
                  setEnterArmed(false);
                  setIsCreateOpen(true);
                }}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
              >
                <PlusIcon />
                新規作成
              </button>
            )}
          </div>
        ) : viewMode === "card" ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <li
                key={project.id}
                className="group rounded-lg border border-zinc-800 bg-zinc-950 transition hover:border-zinc-700"
              >
                <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-black text-xs font-semibold text-zinc-300">
                        {project.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/projects/${project.id}`}
                          className="block truncate text-sm font-medium text-white transition group-hover:text-zinc-200"
                        >
                          {project.name}
                        </Link>
                        <p className="truncate text-xs text-zinc-500">
                          {project.nodeCount} 項目
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project)}
                    aria-label={`${project.name} を削除`}
                    className="rounded-md p-1.5 text-zinc-600 opacity-0 transition hover:bg-zinc-900 hover:text-red-400 group-hover:opacity-100"
                  >
                    <DeleteIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <p className="text-xs text-zinc-500">
                    更新 {formatRelativeDateJa(project.updatedAt)}
                  </p>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-white"
                  >
                    WBS を開く
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-black/40 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">プロジェクト名</th>
                    <th className="px-4 py-3">WBS項目数</th>
                    <th className="px-4 py-3">更新日</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="transition hover:bg-zinc-900/50"
                    >
                      <td className="max-w-[16rem] truncate px-4 py-2.5 font-medium text-zinc-100">
                        <Link
                          href={`/projects/${project.id}`}
                          className="transition hover:text-white"
                          title={project.name}
                        >
                          {project.name}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-400">
                        {project.nodeCount}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                        {formatRelativeDateJa(project.updatedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            label={`${project.name} の WBS を開く`}
                            href={`/projects/${project.id}`}
                            tone="primary"
                          >
                            <ExternalLinkIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            label={`${project.name} を削除`}
                            tone="danger"
                            onClick={() => handleDeleteProject(project)}
                          >
                            <DeleteIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
