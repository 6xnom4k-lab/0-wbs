"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ProjectSidebar } from "@/components/project-sidebar";
import { StorageStatusBanner } from "@/components/storage-status-banner";

type ProjectShellProps = {
  projectId: string;
  children: React.ReactNode;
};

const mobileNavItems = [
  { suffix: "wbs", label: "WBS 構造" },
  { suffix: "tasks", label: "タスク実行" },
  { suffix: "assignees", label: "担当者" },
] as const;

export function ProjectShell({ projectId, children }: ProjectShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <div className="hidden shrink-0 md:block">
        <ProjectSidebar projectId={projectId} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-800 bg-black px-4 py-3 md:hidden">
          <Link
            href="/"
            className="inline-flex text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
          >
            ← プロジェクト一覧
          </Link>
          <div className="mt-3 flex flex-wrap gap-2">
            {mobileNavItems.map((item) => {
              const href = `/projects/${projectId}/${item.suffix}`;
              const isActive = pathname.startsWith(href);

              return (
                <Link
                  key={item.suffix}
                  href={href}
                  className={`rounded-md border px-3 py-2 text-sm transition ${
                    isActive
                      ? "border-zinc-600 bg-zinc-900 text-white"
                      : "border-zinc-800 bg-zinc-950 text-zinc-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        <StorageStatusBanner />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
