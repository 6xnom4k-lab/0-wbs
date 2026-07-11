import { WbsEditor } from "@/components/wbs-editor";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  return <WbsEditor projectId={id} />;
}
