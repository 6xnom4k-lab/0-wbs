"use client";

import { GripVerticalIcon } from "@/components/icons";

type WbsDragHandleProps = {
  label: string;
  onDragStart: () => void;
  onDragEnd: () => void;
};

export function WbsDragHandle({ label, onDragStart, onDragEnd }: WbsDragHandleProps) {
  return (
    <button
      type="button"
      draggable
      aria-label={label}
      title={label}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", "wbs-row");
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      className="inline-flex h-5 w-4 shrink-0 cursor-grab items-center justify-center rounded text-zinc-600 opacity-0 transition hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing group-hover/row:opacity-100 group-focus-within/row:opacity-100"
    >
      <GripVerticalIcon className="h-3.5 w-3.5" />
    </button>
  );
}
