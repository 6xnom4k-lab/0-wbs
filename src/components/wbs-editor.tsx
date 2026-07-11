"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getProject, saveProject } from "@/lib/project-store";
import { countNodes, touchProject } from "@/lib/wbs";
import type { WbsProject } from "@/types/wbs";

import { WbsTree } from "./wbs-tree";

type WbsEditorProps = {
  projectId: string;
};

export function WbsEditor({ projectId }: WbsEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState<WbsProject | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedProject = getProject(projectId);
    if (!storedProject) {
      router.replace("/");
      return;
    }

    setProject(storedProject);
    setIsReady(true);
  }, [projectId, router]);

  const nodeCount = useMemo(() => {
    if (!project) {
      return 0;
    }

    return countNodes(project.root);
  }, [project]);

  const handleProjectChange = (nextProject: WbsProject) => {
    const savedProject = touchProject(nextProject);
    setProject(savedProject);
    saveProject(savedProject);
  };

  if (!isReady || !project) {
    return (
      <div className="mx-auto flex w-full max-w-5xl px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <Link
          href="/"
          className="inline-flex text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← プロジェクト一覧へ戻る
        </Link>

        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            WBS 管理
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {project.name}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            このプロジェクトの作業分解構造を編集します。変更は自動的に保存されます。
          </p>
        </div>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div>
            <p className="text-sm text-zinc-500">プロジェクト</p>
            <h2 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {project.name}
            </h2>
          </div>
          <div className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            項目数: {nodeCount}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
          <WbsTree
            root={project.root}
            onChange={(root) =>
              handleProjectChange({
                ...project,
                root,
                name: root.name,
              })
            }
          />
        </div>
      </section>
    </div>
  );
}
