import { WbsEditor } from "@/components/wbs-editor";

type ProjectWbsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectWbsPage({ params }: ProjectWbsPageProps) {
  const { id } = await params;

  return <WbsEditor projectId={id} />;
}
