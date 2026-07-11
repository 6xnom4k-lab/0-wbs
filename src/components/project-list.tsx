"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  deleteProject as deleteStoredProject,
  listProjectSummaries,
  saveProject,
} from "@/lib/project-store";
import { createProject } from "@/lib/wbs";
import type { WbsProjectSummary } from "@/types/wbs";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ProjectList() {
  const router = useRouter();
  const [projects, setProjects] = useState<WbsProjectSummary[]>([]);
  const [projectName, setProjectName] = useState("");
  const [isReady, setIsReady] = useState(false);

  const refreshProjects = () => {
    setProjects(listProjectSummaries());
  };

  useEffect(() => {
    refreshProjects();
    setIsReady(true);
  }, []);

  const handleCreateProject = () => {
    const trimmed = projectName.trim();
    if (!trimmed) {
      return;
    }

    const project = createProject(trimmed);
    saveProject(project);
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          プロジェクト管理
        </h2>
        <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
          プロジェクトを作成・選択し、各プロジェクトの WBS を編集します。
        </p>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
          新規プロジェクト
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          プロジェクトを作成すると、WBS 編集画面へ移動します。
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleCreateProject();
              }
            }}
            placeholder="例: 新商品開発プロジェクト"
            className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="button"
            onClick={handleCreateProject}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            作成して WBS を編集
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            登録済みプロジェクト
          </h2>
          <span className="text-sm text-zinc-500">{projects.length} 件</span>
        </div>

        {!isReady ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            読み込み中...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 px-6 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
            まだプロジェクトがありません。上のフォームから最初のプロジェクトを作成してください。
          </div>
        ) : (
          <ul className="space-y-3">
            {projects.map((project) => (
              <li
                key={project.id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-xl font-semibold text-zinc-950 transition hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
                    >
                      {project.name}
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-500">
                      <span>項目数: {project.nodeCount}</span>
                      <span>更新: {formatDate(project.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${project.id}`}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                    >
                      WBS を開く
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(project)}
                      className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
