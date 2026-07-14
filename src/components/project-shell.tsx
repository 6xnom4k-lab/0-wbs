import { ProjectSidebar } from "@/components/project-sidebar";
import { StorageStatusBanner } from "@/components/storage-status-banner";

type ProjectShellProps = {
  projectId: string;
  children: React.ReactNode;
};

export function ProjectShell({ projectId, children }: ProjectShellProps) {
  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <ProjectSidebar projectId={projectId} />
      <div className="flex min-w-0 flex-1 flex-col">
        <StorageStatusBanner />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
