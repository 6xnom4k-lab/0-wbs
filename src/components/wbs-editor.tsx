"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MeetingNotesImportDialog } from "@/components/meeting-notes-import-dialog";
import { WbsGanttBoard } from "@/components/wbs-gantt-board";
import { WbsTaskPanel } from "@/components/wbs-task-panel";
import { getProject, saveProject } from "@/lib/project-store";
import { countNodes, findNode, normalizeProjectRoot, touchProject } from "@/lib/wbs";
import type { WbsProject } from "@/types/wbs";

type WbsEditorProps = {
  projectId: string;
};

export function WbsEditor({ projectId }: WbsEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTaskId = searchParams.get("task");
  const [project, setProject] = useState<WbsProject | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const storedProject = await getProject(projectId);
      if (cancelled) {
        return;
      }

      if (!storedProject) {
        router.replace("/");
        return;
      }

      const normalizedRoot = normalizeProjectRoot(storedProject.root, storedProject.name);
      const normalizedProject =
        normalizedRoot === storedProject.root
          ? storedProject
          : { ...storedProject, root: normalizedRoot };

      if (normalizedProject !== storedProject) {
        await saveProject(normalizedProject);
      }

      setProject(normalizedProject);
      setIsReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, router]);

  const nodeCount = useMemo(() => {
    if (!project) {
      return 0;
    }

    return countNodes(project.root);
  }, [project]);

  const handleProjectChange = useCallback((nextProject: WbsProject) => {
    const savedProject = touchProject(nextProject);
    setProject(savedProject);
    void saveProject(savedProject);
  }, []);

  const handleRootChange = useCallback(
    (root: WbsProject["root"]) => {
      if (!project) {
        return;
      }

      handleProjectChange({
        ...project,
        root,
      });
    },
    [handleProjectChange, project],
  );

  const handleImportApply = useCallback(
    (root: WbsProject["root"], result: { appliedCount: number; skippedCount: number }) => {
      if (!project) {
        return;
      }

      handleProjectChange({ ...project, root });
      setImportFeedback(
        `${result.appliedCount} 件を WBS に反映しました。${
          result.skippedCount > 0 ? `（${result.skippedCount} 件スキップ）` : ""
        }`,
      );
      setIsImportOpen(false);
    },
    [handleProjectChange, project],
  );

  const openTask = useCallback(
    (nodeId: string) => {
      router.push(`/projects/${projectId}/wbs?task=${nodeId}`, { scroll: false });
    },
    [projectId, router],
  );

  const closeTask = useCallback(() => {
    router.push(`/projects/${projectId}/wbs`, { scroll: false });
  }, [projectId, router]);

  useEffect(() => {
    if (!isReady || !project || !activeTaskId) {
      return;
    }

    if (!findNode(project.root, activeTaskId)) {
      closeTask();
    }
  }, [activeTaskId, closeTask, isReady, project]);

  if (!isReady || !project) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-8 md:px-10">
        <header className="mb-8">
          <p className="text-sm text-zinc-500">Project</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
            WBS + ガントチャート
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            左側で作業項目を編集し、右側で各タスクのスケジュールを確認できます。変更は自動的に保存されます。
          </p>
        </header>

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div>
              <p className="text-sm text-zinc-500">プロジェクト</p>
              <h2 className="text-lg font-semibold text-white">{project.name}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setImportFeedback(null);
                  setIsImportOpen(true);
                }}
                className="rounded-md border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-xs font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-900 hover:text-white"
              >
                議事録から AI 提案
              </button>
              <div className="rounded-full border border-zinc-800 bg-black px-4 py-2 text-sm font-medium text-zinc-300">
                項目数: {nodeCount}
              </div>
            </div>
          </div>

          {importFeedback && (
            <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-2 text-sm text-emerald-200">
              {importFeedback}
            </p>
          )}

          <WbsGanttBoard
            root={project.root}
            onChange={handleRootChange}
            onOpenTask={openTask}
          />
        </section>
      </div>

      {activeTaskId && (
        <WbsTaskPanel
          nodeId={activeTaskId}
          project={project}
          onProjectChange={handleProjectChange}
          onClose={closeTask}
          onOpenTask={openTask}
        />
      )}

      {isImportOpen && (
        <MeetingNotesImportDialog
          project={project}
          onClose={() => setIsImportOpen(false)}
          onApply={handleImportApply}
        />
      )}
    </>
  );
}
