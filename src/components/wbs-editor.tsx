"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { GanttChart } from "@/components/gantt-chart";
import { TableRowsIcon, TreeViewIcon } from "@/components/icons";
import { ViewModeToggle } from "@/components/view-mode-toggle";
import { getProject, saveProject } from "@/lib/project-store";
import { countNodes, touchProject } from "@/lib/wbs";
import type { WbsProject } from "@/types/wbs";

import { WbsTable } from "./wbs-table";
import { WbsTree } from "./wbs-tree";

type WbsViewMode = "tree" | "table";

const VIEW_MODE_STORAGE_KEY = "0-wbs:wbs-view-mode";

type WbsEditorProps = {
  projectId: string;
};

function readStoredViewMode(): WbsViewMode {
  if (typeof window === "undefined") {
    return "tree";
  }

  const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  return stored === "table" ? "table" : "tree";
}

export function WbsEditor({ projectId }: WbsEditorProps) {
  const router = useRouter();
  const [project, setProject] = useState<WbsProject | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<WbsViewMode>("tree");

  useEffect(() => {
    setViewMode(readStoredViewMode());
  }, []);

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

  const handleViewModeChange = (nextViewMode: WbsViewMode) => {
    setViewMode(nextViewMode);
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, nextViewMode);
  };

  const handleRootChange = (root: WbsProject["root"]) => {
    if (!project) {
      return;
    }

    handleProjectChange({
      ...project,
      root,
      name: root.name,
    });
  };

  if (!isReady || !project) {
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
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          WBS + ガントチャート
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
          作業分解構造を編集し、スケジュールのプレビューを確認します。変更は自動的に保存されます。
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div>
            <p className="text-sm text-zinc-500">WBS</p>
            <h2 className="text-lg font-semibold text-white">{project.name}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={handleViewModeChange}
              options={[
                {
                  value: "tree",
                  label: "ツリー表示",
                  icon: <TreeViewIcon />,
                },
                {
                  value: "table",
                  label: "表表示",
                  icon: <TableRowsIcon />,
                },
              ]}
            />
            <div className="rounded-full border border-zinc-800 bg-black px-4 py-2 text-sm font-medium text-zinc-300">
              項目数: {nodeCount}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          {viewMode === "tree" ? (
            <WbsTree root={project.root} onChange={handleRootChange} />
          ) : (
            <WbsTable root={project.root} onChange={handleRootChange} />
          )}
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-white">ガントチャート</h2>
            <p className="mt-1 text-xs text-zinc-500">
              WBS 構成に基づくスケジュールプレビュー
            </p>
          </div>
          <GanttChart root={project.root} />
        </div>
      </section>
    </div>
  );
}
