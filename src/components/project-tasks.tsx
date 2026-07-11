"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { IconButton } from "@/components/icon-button";
import { DeleteIcon, EditIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { TaskForm } from "@/components/task-form";
import { getProject } from "@/lib/project-store";
import {
  createProjectTask,
  deleteProjectTask,
  listProjectTaskCategories,
  listProjectTasks,
  updateProjectTask,
} from "@/lib/task-store";
import {
  emptyTaskInput,
  formatTaskPeriod,
  getTaskPriorityClassName,
  getTaskPriorityLabel,
  matchesTaskQuery,
  toTaskInput,
  validateTaskInput,
} from "@/lib/task-utils";
import type { ProjectTask, TaskInput } from "@/types/task";

type ProjectTasksProps = {
  projectId: string;
};

type FormMode =
  | { type: "closed" }
  | { type: "create" }
  | { type: "edit"; taskId: string };

export function ProjectTasks({ projectId }: ProjectTasksProps) {
  const router = useRouter();
  const [projectName, setProjectName] = useState<string | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [query, setQuery] = useState("");
  const [formMode, setFormMode] = useState<FormMode>({ type: "closed" });
  const [formError, setFormError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshTasks = () => {
    setTasks(listProjectTasks(projectId));
  };

  useEffect(() => {
    const project = getProject(projectId);
    if (!project) {
      router.replace("/");
      return;
    }

    setProjectName(project.name);
    refreshTasks();
    setIsReady(true);
  }, [projectId, router]);

  const categorySuggestions = useMemo(
    () => listProjectTaskCategories(projectId),
    [projectId, tasks],
  );

  const filteredTasks = useMemo(
    () => tasks.filter((task) => matchesTaskQuery(task, query)),
    [tasks, query],
  );

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
  }, [formMode.type, editingTask]);

  const handleSubmit = (input: TaskInput) => {
    const error = validateTaskInput(input);
    if (error) {
      setFormError(error);
      return;
    }

    if (formMode.type === "edit") {
      updateProjectTask(projectId, formMode.taskId, input);
    } else {
      createProjectTask(projectId, input);
    }

    setFormError(null);
    setFormMode({ type: "closed" });
    refreshTasks();
  };

  const handleDelete = (task: ProjectTask) => {
    const label = task.category ? `${task.category} / ${task.title}` : task.title;
    const confirmed = window.confirm(`「${label}」を削除しますか？`);
    if (!confirmed) {
      return;
    }

    deleteProjectTask(projectId, task.id);
    if (formMode.type === "edit" && formMode.taskId === task.id) {
      setFormMode({ type: "closed" });
    }
    refreshTasks();
  };

  if (!projectName) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 md:px-10">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Project</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">タスク管理</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            「{projectName}」の大項目・項目・詳細・優先度・対応期間を管理します。
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
            新規タスク
          </button>
        </div>
      </header>

      {formMode.type !== "closed" && (
        <section className="mb-6 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-medium text-white">
            {formMode.type === "edit" ? "タスクを編集" : "タスクを追加"}
          </h2>
          {formError && (
            <p className="mt-2 text-sm text-red-400">{formError}</p>
          )}
          <div className="mt-4">
            <TaskForm
              key={formMode.type === "edit" ? formMode.taskId : "create"}
              initialValues={formInitialValues}
              categorySuggestions={categorySuggestions}
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
          <div className="px-4 py-10 text-center text-sm text-zinc-500">読み込み中...</div>
        ) : tasks.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <p className="text-sm text-zinc-400">まだタスクがありません。</p>
            <button
              type="button"
              onClick={() => setFormMode({ type: "create" })}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
            >
              <PlusIcon />
              最初のタスクを追加
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-zinc-500">
            検索条件に一致するタスクがありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-black/40 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">大項目</th>
                  <th className="px-4 py-3">項目</th>
                  <th className="hidden px-4 py-3 lg:table-cell">詳細</th>
                  <th className="px-4 py-3">優先度</th>
                  <th className="px-4 py-3">対応期間</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filteredTasks.map((task) => (
                  <tr key={task.id} className="transition hover:bg-zinc-900/50">
                    <td className="max-w-[10rem] truncate px-4 py-2.5 text-zinc-400">
                      {task.category || "—"}
                    </td>
                    <td className="max-w-[12rem] truncate px-4 py-2.5 font-medium text-zinc-100">
                      {task.title}
                    </td>
                    <td
                      className="hidden max-w-[18rem] truncate px-4 py-2.5 text-zinc-500 lg:table-cell"
                      title={task.detail}
                    >
                      {task.detail || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs ring-1 ring-inset ${getTaskPriorityClassName(task.priority)}`}
                      >
                        {getTaskPriorityLabel(task.priority)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                      {formatTaskPeriod(task.startDate, task.endDate)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label={`${task.title} を編集`}
                          tone="primary"
                          onClick={() => {
                            setFormError(null);
                            setFormMode({ type: "edit", taskId: task.id });
                          }}
                        >
                          <EditIcon className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label={`${task.title} を削除`}
                          tone="danger"
                          onClick={() => handleDelete(task)}
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
        )}
      </section>
    </div>
  );
}
