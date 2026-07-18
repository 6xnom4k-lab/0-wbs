"use client";

import { useEffect, useRef, useState } from "react";

import {
  getWbsStatusColor,
  getWbsStatusLabel,
  getWbsStatusTextColor,
  normalizeWbsStatus,
  WBS_STATUS_OPTIONS,
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

type WbsStatusQuickSelectProps = {
  status?: WbsTaskStatus;
  compact?: boolean;
  onStatusChange: (status: WbsTaskStatus) => void;
};

export function WbsStatusQuickSelect({
  status,
  compact = false,
  onStatusChange,
}: WbsStatusQuickSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const normalized = normalizeWbsStatus(status);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current?.contains(event.target as Node)) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const badgeClassName = `inline-flex max-w-full items-center truncate rounded-full ring-1 ring-inset transition ${getWbsStatusColor(
    normalized,
  )} ${getWbsStatusTextColor(normalized)} ${
    compact ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px] font-medium"
  }`;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="クリックで状態を変更"
        aria-label={`状態: ${getWbsStatusLabel(normalized)}。クリックで変更`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={`${badgeClassName} cursor-pointer hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500`}
      >
        {getWbsStatusLabel(normalized)}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="状態を選択"
          className="absolute left-0 top-full z-30 mt-1 min-w-[96px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 py-1 shadow-xl"
        >
          {WBS_STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === normalized;

            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={(event) => {
                  event.stopPropagation();
                  onStatusChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-2 py-1.5 text-left text-[10px] transition hover:bg-zinc-900 ${
                  isSelected ? "bg-zinc-900/80" : ""
                }`}
              >
                <span
                  className={`inline-flex rounded-full px-1.5 py-0.5 ring-1 ring-inset ${getWbsStatusColor(
                    option.value,
                  )} ${getWbsStatusTextColor(option.value)}`}
                >
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
