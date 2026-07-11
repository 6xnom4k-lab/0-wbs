import { ProjectAssignees } from "@/components/project-assignees";

type ProjectAssigneesPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectAssigneesPage({ params }: ProjectAssigneesPageProps) {
  const { id } = await params;

  return <ProjectAssignees projectId={id} />;
}
