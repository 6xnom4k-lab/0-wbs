"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  ChevronDownIcon,
  DeleteIcon,
  ExternalLinkIcon,
  PlusIcon,
  SearchIcon,
} from "@/components/icons";
import {
  deleteProject as deleteStoredProject,
  listProjectSummaries,
  saveProject,
} from "@/lib/project-store";
import { createProject } from "@/lib/wbs";
import type { WbsProjectSummary } from "@/types/wbs";

function formatRelativeDate(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "just now";
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<WbsProjectSummary[]>([]);
  const [query, setQuery] = useState("");
  const [projectName, setProjectName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const refreshProjects = () => {
    setProjects(listProjectSummaries());
  };

  useEffect(() => {
    refreshProjects();
    setIsReady(true);
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

  const handleCreateProject = () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      return;
    }

    const project = createProject(trimmed);
    saveProject(project);
    setProjectName("");
    setIsCreateOpen(false);
    router.push(`/projects/${project.id}`);
  };

  const handleDeleteProject = (project: WbsProjectSummary) => {
    const confirmed = window.confirm(`「${project.name}」を削除しますか？`);
    if (!confirmed) {
      return;
    }

    deleteStoredProject(project.id);
    refreshProjects();
  };

  return (
    <div className="px-6 py-8 md:px-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">All Projects</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Overview</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Projects..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none transition focus:border-zinc-600"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Add New
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isCreateOpen && (
        <section className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-medium text-white">新規プロジェクト</h2>
          <p className="mt-1 text-xs text-zinc-500">
            作成後、WBS 編集画面へ移動します。
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              autoFocus
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleCreateProject();
                }
                if (event.key === "Escape") {
                  setIsCreateOpen(false);
                }
              }}
              placeholder="例: 新商品開発プロジェクト"
              className="flex-1 rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
            <button
              type="button"
              onClick={handleCreateProject}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              作成して WBS を編集
            </button>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-medium text-zinc-400">Projects</h2>
          <span className="text-xs text-zinc-600">{filteredProjects.length} total</span>
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
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
              >
                <PlusIcon />
                Add New
              </button>
            )}
          </div>
        ) : (
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
                          {project.nodeCount} WBS items
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
                    Updated {formatRelativeDate(project.updatedAt)}
                  </p>
                  <Link
                    href={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1 text-xs text-zinc-400 transition hover:text-white"
                  >
                    Open WBS
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
