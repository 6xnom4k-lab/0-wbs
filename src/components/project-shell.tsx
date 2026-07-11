import { ProjectSidebar } from "@/components/project-sidebar";

type ProjectShellProps = {
  projectId: string;
  children: React.ReactNode;
};

export function ProjectShell({ projectId, children }: ProjectShellProps) {
  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <ProjectSidebar projectId={projectId} />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
