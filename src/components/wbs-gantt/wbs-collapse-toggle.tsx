"use client";

import { ChevronDownIcon, ChevronRightIcon } from "@/components/icons";
import type { WbsFlatRow } from "@/lib/wbs";

type WbsCollapseToggleProps = {
  row: WbsFlatRow;
  onToggle: () => void;
};

export function WbsCollapseToggle({ row, onToggle }: WbsCollapseToggleProps) {
  if (!row.hasChildren) {
    return <span className="w-5 shrink-0" aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={row.isCollapsed ? `${row.name} を展開` : `${row.name} を折りたたむ`}
      aria-expanded={!row.isCollapsed}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
    >
      {row.isCollapsed ? (
        <ChevronRightIcon className="h-3.5 w-3.5" />
      ) : (
        <ChevronDownIcon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
