"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { MeetingNotesImportDialog } from "@/components/meeting-notes-import-dialog";
import { TaskProgressSummary } from "@/components/task-progress-bar";
import { WbsBoardSkeleton } from "@/components/ui/skeleton";
import { WorkflowGuide } from "@/components/workflow-guide";
import { WbsGanttBoard } from "@/components/wbs-gantt-board";
import { WbsTaskPanel } from "@/components/wbs-task-panel";
import { getProject, saveProject } from "@/lib/project-store";
import { createProjectTask } from "@/lib/task-store";
import { listProjectAssigneeNames, normalizeProjectAssignees } from "@/lib/project-assignees";
import { countNodes, findNode, normalizeProjectRoot, touchProject } from "@/lib/wbs";
import { computeWbsBoardProgressStats } from "@/lib/task-progress";
import type { ApplyImportResult } from "@/types/meeting-notes";
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
  const [loadError, setLoadError] = useState<string | null>(null);
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
      const normalizedProject = normalizeProjectAssignees({
        ...storedProject,
        root: normalizedRoot,
      });

      const needsAssigneeMigration = !Array.isArray(storedProject.assignees);
      const needsRootMigration = normalizedRoot !== storedProject.root;

      if (needsAssigneeMigration || needsRootMigration) {
        try {
          await saveProject(normalizedProject);
        } catch (error) {
          console.error("Failed to migrate project on load:", error);
        }
      }

      if (!cancelled) {
        setProject(normalizedProject);
        setIsReady(true);
      }
    })().catch((error) => {
      console.error("Failed to load project:", error);
      if (!cancelled) {
        setLoadError(
          error instanceof Error ? error.message : "プロジェクトの読み込みに失敗しました",
        );
        setIsReady(true);
      }
    });

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

  const progressStats = useMemo(() => {
    if (!project) {
      return null;
    }

    return computeWbsBoardProgressStats(project.root);
  }, [project]);

  const assigneeOptions = useMemo(
    () => (project ? listProjectAssigneeNames(project) : []),
    [project],
  );

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
    async (result: ApplyImportResult) => {
      if (!project) {
        return;
      }

      handleProjectChange({ ...project, root: result.root });

      for (const input of result.manualTaskInputs) {
        await createProjectTask(projectId, input);
      }

      const parts: string[] = [];
      if (result.wbsAppliedCount > 0) {
        parts.push(`WBS 構造に ${result.wbsAppliedCount} 件`);
      }
      if (result.manualTasksCreated > 0) {
        parts.push(`付箋タスク ${result.manualTasksCreated} 件`);
      }

      setImportFeedback(
        `${parts.join("・")}を反映しました。${
          result.wbsSkippedCount + result.manualTasksSkipped > 0
            ? `（${result.wbsSkippedCount + result.manualTasksSkipped} 件スキップ）`
            : ""
        }`,
      );
      setIsImportOpen(false);
    },
    [handleProjectChange, project, projectId],
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

  if (loadError) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-red-400">読み込みに失敗しました: {loadError}</p>
      </div>
    );
  }

  if (!isReady || !project) {
    return (
      <div className="px-6 py-8 md:px-10">
        <header className="mb-8">
          <p className="text-sm text-zinc-500">プロジェクト</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">WBS 構造</h1>
        </header>
        <WbsBoardSkeleton />
      </div>
    );
  }

  return (
    <>
      <div className="px-6 py-8 md:px-10">
        <header className="mb-8">
          <p className="text-sm text-zinc-500">プロジェクト</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">WBS 構造</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            会議で合意した作業分解（骨格）を編集します。左で項目を編集し、右のガントで期間と進捗を確認できます。
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <Link
              href={`/projects/${projectId}/tasks`}
              className="text-sky-400 transition hover:text-sky-300"
            >
              追加タスク（付箋）はタスク実行へ →
            </Link>
          </div>
        </header>

        <WorkflowGuide className="mb-6" />

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

          {progressStats && (
            <TaskProgressSummary stats={progressStats} />
          )}

          {importFeedback && (
            <p className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-2 text-sm text-emerald-200">
              {importFeedback}
            </p>
          )}

          <WbsGanttBoard
            root={project.root}
            assigneeOptions={assigneeOptions}
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
