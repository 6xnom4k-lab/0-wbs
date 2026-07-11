import { ProjectTasks } from "@/components/project-tasks";

type ProjectTasksPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const { id } = await params;

  return <ProjectTasks projectId={id} />;
}
