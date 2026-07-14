import { Suspense } from "react";

import { WbsEditor } from "@/components/wbs-editor";

type ProjectWbsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProjectWbsPage({ params }: ProjectWbsPageProps) {
  const { id } = await params;

  return (
    <Suspense
      fallback={
        <div className="px-6 py-10">
          <p className="text-sm text-zinc-500">読み込み中...</p>
        </div>
      }
    >
      <WbsEditor projectId={id} />
    </Suspense>
  );
}
