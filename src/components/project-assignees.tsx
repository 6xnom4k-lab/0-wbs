"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getProject } from "@/lib/project-store";

type ProjectAssigneesProps = {
  projectId: string;
};

export function ProjectAssignees({ projectId }: ProjectAssigneesProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const project = await getProject(projectId);
      if (!project) {
        router.replace("/");
        return;
      }

      setProjectName(project.name);
    })();
  }, [projectId, router]);

  if (!projectName) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-8">
        <p className="text-sm text-zinc-500">Project</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">担当者管理</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          「{projectName}」に参加する担当者を管理します。
        </p>
      </header>

      <section className="rounded-lg border border-dashed border-zinc-800 px-6 py-16 text-center">
        <p className="text-sm text-zinc-400">担当者管理画面は準備中です。</p>
        <p className="mt-2 text-xs text-zinc-600">
          プロジェクトメンバーの追加・WBS 項目への割り当てをここに追加します。
        </p>
        <Link
          href="/account"
          className="mt-6 inline-flex rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
        >
          アカウントマスターを開く
        </Link>
      </section>
    </div>
  );
}
