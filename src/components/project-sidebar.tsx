"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { GanttIcon, TaskListIcon, UsersIcon } from "@/components/icons";
import { getProject } from "@/lib/project-store";

type ProjectSidebarProps = {
  projectId: string;
};

const menuItems = [
  {
    suffix: "wbs",
    label: "WBS + ガントチャート",
    icon: GanttIcon,
  },
  {
    suffix: "tasks",
    label: "タスク管理",
    icon: TaskListIcon,
  },
  {
    suffix: "assignees",
    label: "担当者管理",
    icon: UsersIcon,
  },
] as const;

export function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();
  const [projectName, setProjectName] = useState("プロジェクト");

  useEffect(() => {
    const project = getProject(projectId);
    if (project) {
      setProjectName(project.name);
    }
  }, [projectId]);

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-zinc-800 bg-black text-zinc-300">
      <div className="border-b border-zinc-800 px-4 py-4">
        <Link
          href="/"
          className="mb-3 inline-flex text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
        >
          ← プロジェクト一覧
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-800 bg-zinc-950 text-xs font-semibold text-zinc-300">
            {projectName.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{projectName}</p>
            <p className="truncate text-xs text-zinc-500">Project</p>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
        {menuItems.map((item) => {
          const href = `/projects/${projectId}/${item.suffix}`;
          const isActive = pathname.startsWith(href);
          const Icon = item.icon;

          return (
            <Link
              key={item.suffix}
              href={href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
