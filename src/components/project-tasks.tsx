"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IconButton } from "@/components/icon-button";
import { GoogleCalendarButton } from "@/components/google-calendar-button";
import { DeleteIcon, EditIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { ProjectTaskPanel } from "@/components/project-task-panel";
import { TaskForm } from "@/components/task-form";
import { WbsTaskPanel } from "@/components/wbs-task-panel";
import { WbsStatusQuickSelect } from "@/components/wbs-status-badge";
import { TaskProgressEditor, TaskProgressSummary } from "@/components/task-progress-bar";
import { TaskListSkeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  assigneeSuggestionNames,
  buildAssigneeSuggestions,
  type AssigneeSuggestion,
} from "@/lib/assignee-suggestions";
import { listAccounts } from "@/lib/account-store";
import { TaskSourceBadge } from "@/components/task-source-badge";
import { WorkflowGuide } from "@/components/workflow-guide";
import { getProject, saveProject } from "@/lib/project-store";
import {
  createProjectTask,
  deleteProjectTask,
  listProjectTaskCategories,
  listProjectTasks,
  updateProjectTask,
} from "@/lib/task-store";
import {
  countMyPendingTasks,
  filterUnifiedTasks,
  groupTasksByAssignee,
  listAssigneeNames,
  type TaskQuickFilter,
} from "@/lib/task-filters";
import { readMyAssigneeName, writeMyAssigneeName } from "@/lib/my-assignee";
import { buildUnifiedTasks, listWbsNodeOptions } from "@/lib/unified-tasks";
import {
  emptyTaskInput,
  formatTaskPeriod,
  formatUnifiedTaskScheduledAt,
  getTaskPriorityClassName,
  getTaskPriorityLabel,
  toTaskInput,
  validateTaskInput,
} from "@/lib/task-utils";
import { touchProject, updateNode, findNode } from "@/lib/wbs";
import { computeUnifiedProgressStats, syncProgressWithStatus } from "@/lib/task-progress";
import { WBS_STATUS_OPTIONS } from "@/lib/wbs-task-meta";
import type { ProjectTask, TaskInput } from "@/types/task";
import type { TaskViewMode, UnifiedTask } from "@/types/unified-task";
import type { WbsProject, WbsTaskStatus } from "@/types/wbs";

type ProjectTasksProps = {
  projectId: string;
};

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; taskId: string };

function TaskSourceBadgeWrapper({ source }: { source: UnifiedTask["source"] }) {
  return <TaskSourceBadge source={source} compact />;
}

type TaskTableProps = {
  tasks: UnifiedTask[];
  projectId: string;
  onWbsStatusChange: (nodeId: string, status: WbsTaskStatus) => void;
  onManualStatusChange: (taskId: string, status: WbsTaskStatus) => void;
  onWbsProgressChange: (nodeId: string, progressPercent: number, status: WbsTaskStatus) => void;
  onManualProgressChange: (
    taskId: string,
    progressPercent: number,
    status: WbsTaskStatus,
  ) => void;
  onOpenDetail: (task: UnifiedTask) => void;
  onEditManual: (taskId: string) => void;
  onDeleteManual: (task: UnifiedTask) => void;
};

function TaskTable({
  tasks,
  projectId,
  onWbsStatusChange,
  onManualStatusChange,
  onWbsProgressChange,
  onManualProgressChange,
  onOpenDetail,
  onEditManual,
  onDeleteManual,
}: TaskTableProps) {
  if (tasks.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-sm text-zinc-500">
        表示するタスクがありません。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-black/40 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
          <tr>
            <th scope="col" className="px-4 py-3">種別</th>
            <th scope="col" className="px-4 py-3">WBS 割当</th>
            <th scope="col" className="px-4 py-3">担当</th>
            <th scope="col" className="px-4 py-3">大項目</th>
            <th scope="col" className="px-4 py-3">項目</th>
            <th scope="col" className="hidden px-4 py-3 lg:table-cell">詳細</th>
            <th scope="col" className="px-4 py-3">状態</th>
            <th scope="col" className="px-4 py-3">進捗</th>
            <th scope="col" className="px-4 py-3">優先度</th>
            <th scope="col" className="px-4 py-3">対応期間</th>
            <th scope="col" className="px-4 py-3">対応予定</th>
            <th scope="col" className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {tasks.map((task) => (
            <tr key={task.key} className="transition hover:bg-zinc-900/50">
              <td className="whitespace-nowrap px-4 py-2.5">
                <TaskSourceBadgeWrapper source={task.source} />
              </td>
              <td className="max-w-[14rem] px-4 py-2.5 text-zinc-400">
                {task.wbsLabel ? (
                  <span className="line-clamp-2 text-xs leading-5" title={task.wbsLabel}>
                    {task.wbsLabel}
                  </span>
                ) : (
                  <span className="text-zinc-600">未割当</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-zinc-300">
                {task.assignee || "—"}
              </td>
              <td className="max-w-[10rem] truncate px-4 py-2.5 text-zinc-400">
                {task.category || "—"}
              </td>
              <td className="max-w-[12rem] px-4 py-2.5 font-medium text-zinc-100">
                <button
                  type="button"
                  onClick={() => onOpenDetail(task)}
                  className="block max-w-full truncate text-left transition hover:text-white hover:underline"
                  title={task.title}
                >
                  {task.title}
                </button>
              </td>
              <td
                className="hidden max-w-[18rem] truncate px-4 py-2.5 text-zinc-500 lg:table-cell"
                title={task.detail}
              >
                {task.detail || "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                {task.source === "wbs" && task.wbsNodeId ? (
                  <WbsStatusQuickSelect
                    status={task.status}
                    compact
                    onStatusChange={(status) => onWbsStatusChange(task.wbsNodeId, status)}
                  />
                ) : task.manualTaskId ? (
                  <WbsStatusQuickSelect
                    status={task.status}
                    compact
                    onStatusChange={(status) => onManualStatusChange(task.manualTaskId!, status)}
                  />
                ) : null}
              </td>
              <td className="min-w-[120px] px-4 py-2.5">
                {task.source === "wbs" && task.wbsNodeId ? (
                  <TaskProgressEditor
                    progressPercent={task.progressPercent}
                    status={task.status}
                    compact
                    onChange={(progressPercent, status) =>
                      onWbsProgressChange(task.wbsNodeId, progressPercent, status)
                    }
                  />
                ) : task.manualTaskId ? (
                  <TaskProgressEditor
                    progressPercent={task.progressPercent}
                    status={task.status}
                    compact
                    onChange={(progressPercent, status) =>
                      onManualProgressChange(task.manualTaskId!, progressPercent, status)
                    }
                  />
                ) : null}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5">
                {task.source === "manual" ? (
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${getTaskPriorityClassName(task.priority)}`}
                  >
                    {getTaskPriorityLabel(task.priority)}
                  </span>
                ) : (
                  <span className="text-xs text-zinc-600">—</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                {formatTaskPeriod(task.startDate, task.endDate)}
              </td>
              <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                {formatUnifiedTaskScheduledAt(task)}
              </td>
              <td className="px-4 py-2.5">
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenDetail(task)}
                    className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:bg-zinc-900"
                  >
                    詳細
                  </button>
                  {task.source === "manual" && task.scheduledAt && (
                    <GoogleCalendarButton
                      title={task.title}
                      startAt={task.scheduledAt}
                      endAt={task.scheduledEndAt || undefined}
                      description={task.detail}
                      label="カレンダー"
                      className="px-2 py-1 text-xs"
                    />
                  )}
                  {task.source === "manual" && task.manualTaskId && (
                    <>
                      <IconButton
                        label={`${task.title} を編集`}
                        tone="primary"
                        onClick={() => onEditManual(task.manualTaskId!)}
                      >
                        <EditIcon className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        label={`${task.title} を削除`}
                        tone="danger"
                        onClick={() => onDeleteManual(task)}
                      >
                        <DeleteIcon className="h-4 w-4" />
                      </IconButton>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirm();
  const activeWbsId = searchParams.get("wbs");
  const activeTaskId = searchParams.get("task");
  const [project, setProject] = useState<WbsProject | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState<AssigneeSuggestion[]>([]);
  const [query, setQuery] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<WbsTaskStatus | "all">("all");
  const [quickFilter, setQuickFilter] = useState<TaskQuickFilter>("all");
  const [myAssigneeName, setMyAssigneeName] = useState("");
  const [viewMode, setViewMode] = useState<TaskViewMode>("all");
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);

  const refreshData = async () => {
    const [loadedProject, nextTasks, nextCategories, accounts] = await Promise.all([
      getProject(projectId),
      listProjectTasks(projectId),
      listProjectTaskCategories(projectId),
      listAccounts(),
    ]);

    if (!loadedProject) {
      router.replace("/");
      return false;
    }

    setProject(loadedProject);
    setTasks(nextTasks);
    setCategories(nextCategories);
    setAssigneeSuggestions(buildAssigneeSuggestions(loadedProject, accounts));
    return true;
  };

  useEffect(() => {
    void (async () => {
      const ok = await refreshData();
      if (ok) {
        setIsReady(true);
      }
    })();
  }, [projectId, router]);

  useEffect(() => {
    const savedAssignee = readMyAssigneeName();
    setMyAssigneeName(savedAssignee);
    if (savedAssignee) {
      setQuickFilter("my_pending");
      setAssigneeFilter(savedAssignee);
    }
  }, []);

  const unifiedTasks = useMemo(() => {
    if (!project) {
      return [];
    }

    return buildUnifiedTasks(project, tasks);
  }, [project, tasks]);

  const assigneeNames = useMemo(() => listAssigneeNames(unifiedTasks), [unifiedTasks]);

  const filteredTasks = useMemo(
    () =>
      filterUnifiedTasks(unifiedTasks, {
        query,
        assignee: assigneeFilter,
        status: statusFilter,
        quickFilter,
        myAssigneeName,
      }),
    [assigneeFilter, myAssigneeName, query, quickFilter, statusFilter, unifiedTasks],
  );

  const myPendingCount = useMemo(
    () => countMyPendingTasks(unifiedTasks, myAssigneeName),
    [myAssigneeName, unifiedTasks],
  );

  const groupedTasks = useMemo(
    () => groupTasksByAssignee(filteredTasks),
    [filteredTasks],
  );

  const wbsNodeOptions = useMemo(
    () => (project ? listWbsNodeOptions(project.root) : []),
    [project],
  );

  const progressStats = useMemo(
    () => computeUnifiedProgressStats(unifiedTasks),
    [unifiedTasks],
  );

  const stats = useMemo(() => {
    const wbsCount = unifiedTasks.filter((task) => task.source === "wbs").length;
    const manualCount = unifiedTasks.filter((task) => task.source === "manual").length;
    return { wbsCount, manualCount, total: unifiedTasks.length };
  }, [unifiedTasks]);

  const editingTask = useMemo(() => {
    if (formMode.type !== "edit") {
      return null;
    }

    return tasks.find((task) => task.id === formMode.taskId) ?? null;
  }, [formMode, tasks]);

  const formInitialValues = useMemo(() => {
    if (formMode.type === "edit" && editingTask) {
      return toTaskInput(editingTask);
    }

    return emptyTaskInput();
  }, [editingTask, formMode.type]);

  const handleSubmit = async (input: TaskInput) => {
    const error = validateTaskInput(input);
    if (error) {
      setFormError(error);
      return;
    }

    if (formMode.type === "edit") {
      await updateProjectTask(projectId, formMode.taskId, input);
    } else {
      await createProjectTask(projectId, input);
    }

    setFormError(null);
    setFormMode({ type: "closed" });
    await refreshData();
  };

  const handleDeleteManual = async (task: UnifiedTask) => {
    if (!task.manualTaskId) {
      return;
    }

    const label = task.category ? `${task.category} / ${task.title}` : task.title;
    const confirmed = await confirm({
      title: "タスクの削除",
      description: `「${label}」を削除します。この操作は取り消せません。`,
      confirmLabel: "削除",
      tone: "danger",
    });
    if (!confirmed) {
      return;
    }

    await deleteProjectTask(projectId, task.manualTaskId);
    if (formMode.type === "edit" && formMode.taskId === task.manualTaskId) {
      setFormMode({ type: "closed" });
    }
    await refreshData();
  };

  const handleManualStatusChange = useCallback(
    async (taskId: string, status: WbsTaskStatus) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        return;
      }

      await updateProjectTask(projectId, taskId, {
        ...toTaskInput(task),
        status,
        progressPercent: syncProgressWithStatus(status, task.progressPercent),
      });
      await refreshData();
    },
    [projectId, tasks],
  );

  const handleWbsStatusChange = useCallback(
    async (nodeId: string, status: WbsTaskStatus) => {
      if (!project) {
        return;
      }

      const nextRoot = updateNode(project.root, nodeId, (current) => ({
        ...current,
        status,
        progressPercent: syncProgressWithStatus(status, current.progressPercent),
      }));
      const nextProject = touchProject({ ...project, root: nextRoot });
      await saveProject(nextProject);
      setProject(nextProject);
    },
    [project],
  );

  const handleManualProgressChange = useCallback(
    async (taskId: string, progressPercent: number, status: WbsTaskStatus) => {
      const task = tasks.find((item) => item.id === taskId);
      if (!task) {
        return;
      }

      await updateProjectTask(projectId, taskId, {
        ...toTaskInput(task),
        progressPercent,
        status,
      });
      await refreshData();
    },
    [projectId, tasks],
  );

  const handleWbsProgressChange = useCallback(
    async (nodeId: string, progressPercent: number, status: WbsTaskStatus) => {
      if (!project) {
        return;
      }

      const nextRoot = updateNode(project.root, nodeId, (current) => ({
        ...current,
        progressPercent,
        status,
      }));
      const nextProject = touchProject({ ...project, root: nextRoot });
      await saveProject(nextProject);
      setProject(nextProject);
    },
    [project],
  );

  const activeManualTask = useMemo(
    () => tasks.find((item) => item.id === activeTaskId) ?? null,
    [activeTaskId, tasks],
  );

  const openDetail = useCallback(
    (task: UnifiedTask) => {
      if (task.source === "wbs" && task.wbsNodeId) {
        router.push(`/projects/${projectId}/tasks?wbs=${task.wbsNodeId}`, { scroll: false });
        return;
      }

      if (task.manualTaskId) {
        router.push(`/projects/${projectId}/tasks?task=${task.manualTaskId}`, { scroll: false });
      }
    },
    [projectId, router],
  );

  const closeDetail = useCallback(() => {
    router.push(`/projects/${projectId}/tasks`, { scroll: false });
  }, [projectId, router]);

  const handleProjectChange = useCallback(async (nextProject: WbsProject) => {
    const saved = touchProject(nextProject);
    await saveProject(saved);
    setProject(saved);
  }, []);

  const handleManualTaskChange = useCallback((updated: ProjectTask) => {
    setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }, []);

  useEffect(() => {
    if (!isReady || !project) {
      return;
    }

    if (activeWbsId && !findNode(project.root, activeWbsId)) {
      closeDetail();
    }

    if (activeTaskId && !tasks.some((item) => item.id === activeTaskId)) {
      closeDetail();
    }
  }, [activeTaskId, activeWbsId, closeDetail, isReady, project, tasks]);

  if (!project) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <>
    <div className="px-6 py-8 md:px-10">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-zinc-500">プロジェクト</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">タスク実行</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            WBS 構造の作業項目（骨格）と、それ以外の追加タスク（付箋）をまとめて確認・更新します。
            骨格の編集は{" "}
            <Link
              href={`/projects/${projectId}/wbs`}
              className="text-sky-400 transition hover:text-sky-300"
            >
              WBS 構造
            </Link>
            から行います。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="タスクを検索..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none transition focus:border-zinc-600"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setFormError(null);
              setFormMode({ type: "create" });
            }}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            <PlusIcon />
            タスクを追加
          </button>
        </div>
      </header>

      <section className="mb-4">
        <TaskProgressSummary
          stats={progressStats}
          myPendingCount={myPendingCount}
          onFilterClick={(filter) => {
            setQuickFilter(filter);
            if (filter === "my_pending" && myAssigneeName) {
              setAssigneeFilter(myAssigneeName);
              setStatusFilter("all");
            } else if (filter !== "my_pending" && filter !== "overdue") {
              setStatusFilter(filter);
              setQuickFilter(filter);
            } else {
              setStatusFilter("all");
            }
          }}
        />
      </section>

      <WorkflowGuide className="mb-4" />

      <section className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3">
        <div className="flex rounded-md border border-zinc-800 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("all")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "all"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            全体
          </button>
          <button
            type="button"
            onClick={() => setViewMode("byAssignee")}
            className={`rounded px-3 py-1.5 text-xs font-medium transition ${
              viewMode === "byAssignee"
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            担当者別
          </button>
        </div>

        {viewMode === "all" && (
          <>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>自分</span>
              <select
                value={myAssigneeName}
                onChange={(event) => {
                  const next = event.target.value;
                  setMyAssigneeName(next);
                  writeMyAssigneeName(next);
                  if (next && quickFilter === "my_pending") {
                    setAssigneeFilter(next);
                  }
                }}
                className="rounded-md border border-zinc-800 bg-black px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              >
                <option value="">未設定</option>
                {assigneeNames
                  .filter((name) => name !== "未割当")
                  .map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>クイック</span>
              <select
                value={quickFilter}
                onChange={(event) => {
                  const next = event.target.value as TaskQuickFilter;
                  setQuickFilter(next);
                  if (next === "all") {
                    setStatusFilter("all");
                  }
                }}
                className="rounded-md border border-zinc-800 bg-black px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              >
                <option value="all">すべて</option>
                <option value="my_pending">自分の未完了</option>
                <option value="overdue">期限超過</option>
                <option value="not_started">未着手</option>
                <option value="in_progress">進行中</option>
                <option value="done">完了</option>
                <option value="on_hold">保留</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>担当者</span>
              <select
                value={assigneeFilter}
                onChange={(event) => setAssigneeFilter(event.target.value)}
                className="rounded-md border border-zinc-800 bg-black px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              >
                <option value="all">すべて</option>
                {assigneeNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <span>状態</span>
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as WbsTaskStatus | "all")
                }
                className="rounded-md border border-zinc-800 bg-black px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-zinc-600"
              >
                <option value="all">すべて</option>
                {WBS_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}

        <div className="ml-auto flex flex-wrap gap-3 text-xs text-zinc-500">
          <span>合計 {stats.total} 件</span>
          <span>WBS {stats.wbsCount}</span>
          <span>追加 {stats.manualCount}</span>
        </div>
      </section>

      {formMode.type !== "closed" && (
        <section className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-medium text-zinc-400">
            {formMode.type === "edit" ? "付箋タスクを編集" : "付箋タスクを作成"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            WBS 構造にない作業を追加します。後から WBS 項目へ紐付けできます。WBS
            項目そのものは{" "}
            <Link href={`/projects/${projectId}/wbs`} className="text-sky-400 hover:text-sky-300">
              WBS 構造
            </Link>
            で編集してください。
          </p>
          {formError && <p className="mt-2 text-sm text-red-400">{formError}</p>}
          <div className="mt-4">
            <TaskForm
              key={formMode.type === "edit" ? formMode.taskId : "create"}
              initialValues={formInitialValues}
              categorySuggestions={categories}
              assigneeSuggestions={assigneeSuggestionNames(assigneeSuggestions)}
              assigneeSuggestionDetails={assigneeSuggestions}
              wbsNodeOptions={wbsNodeOptions}
              submitLabel={formMode.type === "edit" ? "更新" : "追加"}
              onSubmit={handleSubmit}
              onCancel={() => {
                setFormError(null);
                setFormMode({ type: "closed" });
              }}
            />
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        {!isReady ? (
          <TaskListSkeleton />
        ) : unifiedTasks.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-zinc-400">WBS に作業項目がまだありません。</p>
            <Link
              href={`/projects/${projectId}/wbs`}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              WBS を編集
            </Link>
          </div>
        ) : viewMode === "all" ? (
          filteredTasks.length === 0 ? (
            <div className="px-4 py-16 text-center text-sm text-zinc-500">
              検索条件に一致するタスクがありません。
            </div>
          ) : (
            <TaskTable
              tasks={filteredTasks}
              projectId={projectId}
              onWbsStatusChange={handleWbsStatusChange}
              onManualStatusChange={(taskId, status) => void handleManualStatusChange(taskId, status)}
              onWbsProgressChange={(nodeId, progressPercent, status) =>
                void handleWbsProgressChange(nodeId, progressPercent, status)
              }
              onManualProgressChange={(taskId, progressPercent, status) =>
                void handleManualProgressChange(taskId, progressPercent, status)
              }
              onOpenDetail={openDetail}
              onEditManual={(taskId) => {
                setFormError(null);
                setFormMode({ type: "edit", taskId });
              }}
              onDeleteManual={(task) => void handleDeleteManual(task)}
            />
          )
        ) : (
          <div className="divide-y divide-zinc-800">
            {groupedTasks.map((group) => (
              <section key={group.assignee}>
                <header className="flex items-center justify-between bg-black/30 px-4 py-3">
                  <h2 className="text-sm font-medium text-white">{group.assignee}</h2>
                  <span className="text-xs text-zinc-500">{group.tasks.length} 件</span>
                </header>
                <TaskTable
                  tasks={group.tasks}
                  projectId={projectId}
                  onWbsStatusChange={handleWbsStatusChange}
                  onManualStatusChange={(taskId, status) =>
                    void handleManualStatusChange(taskId, status)
                  }
                  onWbsProgressChange={(nodeId, progressPercent, status) =>
                    void handleWbsProgressChange(nodeId, progressPercent, status)
                  }
                  onManualProgressChange={(taskId, progressPercent, status) =>
                    void handleManualProgressChange(taskId, progressPercent, status)
                  }
                  onOpenDetail={openDetail}
                  onEditManual={(taskId) => {
                    setFormError(null);
                    setFormMode({ type: "edit", taskId });
                  }}
                  onDeleteManual={(task) => void handleDeleteManual(task)}
                />
              </section>
            ))}
          </div>
        )}
      </section>
    </div>

      {activeWbsId && findNode(project.root, activeWbsId) && (
        <WbsTaskPanel
          nodeId={activeWbsId}
          project={project}
          onProjectChange={handleProjectChange}
          onClose={closeDetail}
          onOpenTask={(nodeId) =>
            router.push(`/projects/${projectId}/tasks?wbs=${nodeId}`, { scroll: false })
          }
        />
      )}

      {activeTaskId && activeManualTask && (
        <ProjectTaskPanel
          taskId={activeTaskId}
          project={project}
          task={activeManualTask}
          onTaskChange={handleManualTaskChange}
          onClose={closeDetail}
        />
      )}
    </>
  );
}
