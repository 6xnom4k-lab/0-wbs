type WorkflowGuideProps = {
  className?: string;
};

export function WorkflowGuide({ className = "" }: WorkflowGuideProps) {
  return (
    <div
      className={`rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 ${className}`}
    >
      <p className="text-xs font-medium text-zinc-400">進め方</p>
      <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-zinc-500">
        <li>
          <span className="text-zinc-400">WBS 構造</span> で作業を分解する
        </li>
        <li>
          <span className="text-zinc-400">担当者管理</span> でメンバーを登録する
        </li>
        <li>期間・状態を更新し、ガントで全体を確認する</li>
      </ol>
    </div>
  );
}
