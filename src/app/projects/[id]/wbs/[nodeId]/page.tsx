import { redirect } from "next/navigation";

type WbsTaskPageProps = {
  params: Promise<{ id: string; nodeId: string }>;
};

export default async function WbsTaskPage({ params }: WbsTaskPageProps) {
  const { id, nodeId } = await params;

  redirect(`/projects/${id}/wbs?task=${nodeId}`);
}
