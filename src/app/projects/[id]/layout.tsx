import { ProjectShell } from "@/components/project-shell";

type ProjectLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
  const { id } = await params;

  return <ProjectShell projectId={id}>{children}</ProjectShell>;
}
