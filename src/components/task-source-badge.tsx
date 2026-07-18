import type { UnifiedTaskSource } from "@/types/unified-task";

const SOURCE_META: Record<
  UnifiedTaskSource,
  { label: string; title: string; className: string }
> = {
  wbs: {
    label: "骨格",
    title: "WBS 構造の作業項目（会議で合意した計画）",
    className: "bg-sky-950/50 text-sky-300 ring-sky-900/60",
  },
  manual: {
    label: "付箋",
    title: "WBS 外の追加タスク（後から WBS 項目へ紐付け可能）",
    className: "bg-violet-950/50 text-violet-300 ring-violet-900/60",
  },
};

type TaskSourceBadgeProps = {
  source: UnifiedTaskSource;
  compact?: boolean;
};

export function TaskSourceBadge({ source, compact = false }: TaskSourceBadgeProps) {
  const meta = SOURCE_META[source];

  return (
    <span
      title={meta.title}
      className={`inline-flex rounded-full px-2 py-0.5 font-medium ring-1 ring-inset ${
        compact ? "text-[10px]" : "text-xs"
      } ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
