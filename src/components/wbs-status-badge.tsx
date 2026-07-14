import {
  getWbsStatusColor,
  getWbsStatusLabel,
  getWbsStatusTextColor,
  normalizeWbsStatus,
} from "@/lib/wbs-task-meta";
import type { WbsTaskStatus } from "@/types/wbs";

type WbsStatusBadgeProps = {
  status?: WbsTaskStatus;
  compact?: boolean;
};

export function WbsStatusBadge({ status, compact = false }: WbsStatusBadgeProps) {
  const normalized = normalizeWbsStatus(status);

  return (
    <span
      className={`inline-flex max-w-full items-center truncate rounded-full ring-1 ring-inset ${getWbsStatusColor(
        normalized,
      )} ${getWbsStatusTextColor(normalized)} ${
        compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] font-medium"
      }`}
    >
      {getWbsStatusLabel(normalized)}
    </span>
  );
}
