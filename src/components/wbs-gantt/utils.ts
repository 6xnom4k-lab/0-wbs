import type { DragEvent } from "react";

import type { WbsFlatRow } from "@/lib/wbs";

import type { DropPosition } from "./types";

export function getRowChromeClasses(
  row: WbsFlatRow,
  rowIndex: number,
  isDragging: boolean,
  dropPosition: DropPosition | null,
): string {
  return [
    row.isRoot && rowIndex > 0 ? "border-t border-zinc-800/90" : "",
    isDragging ? "opacity-40" : "",
    dropPosition === "before" ? "border-t-2 border-t-sky-500" : "",
    dropPosition === "after" ? "border-b-2 border-b-sky-500" : "",
    dropPosition === "inside" ? "bg-sky-950/25 ring-1 ring-inset ring-sky-500/50" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getDropPosition(
  event: DragEvent<HTMLDivElement>,
  canNestInside: boolean,
): DropPosition {
  const bounds = event.currentTarget.getBoundingClientRect();
  const ratio = (event.clientY - bounds.top) / bounds.height;

  if (canNestInside && ratio > 0.25 && ratio < 0.75) {
    return "inside";
  }

  return ratio < 0.5 ? "before" : "after";
}

export function focusWbsRowName(rowIndex: number): void {
  const next = document.querySelector<HTMLInputElement>(
    `[data-wbs-row-name][data-row-index="${rowIndex + 1}"]`,
  );
  next?.focus();
  next?.select();
}

export function commitWbsRowName(rowIndex: number): void {
  const current = document.querySelector<HTMLInputElement>(
    `[data-wbs-row-name][data-row-index="${rowIndex}"]`,
  );
  current?.blur();
}
