"use client";

import { useEffect, useRef, useState } from "react";

type WbsAssigneeQuickSelectProps = {
  value?: string;
  options: string[];
  compact?: boolean;
  onChange: (assignee: string) => void;
};

export function WbsAssigneeQuickSelect({
  value,
  options,
  compact = false,
  onChange,
}: WbsAssigneeQuickSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const label = value?.trim() || "未割当";

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

  if (options.length === 0) {
    return (
      <span
        className={`block truncate px-1 text-[10px] text-zinc-600 ${compact ? "" : ""}`}
        title="担当者管理で担当者を追加してください"
      >
        {value?.trim() || "—"}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="クリックで担当者を変更"
        aria-label={`担当者: ${label}。クリックで変更`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className={`block w-full truncate rounded px-1 text-left text-[10px] transition hover:bg-zinc-900 hover:text-zinc-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-600 ${
          value?.trim() ? "text-zinc-400" : "text-zinc-600"
        }`}
      >
        {value?.trim() || "未割当"}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="担当者を選択"
          className="absolute left-0 top-full z-30 mt-1 min-w-[120px] overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 py-1 shadow-xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value?.trim()}
            onClick={(event) => {
              event.stopPropagation();
              onChange("");
              setOpen(false);
            }}
            className="block w-full px-3 py-1.5 text-left text-[10px] text-zinc-500 transition hover:bg-zinc-900"
          >
            未割当
          </button>
          {options.map((option) => (
            <button
              key={option}
              type="button"
              role="option"
              aria-selected={option === value?.trim()}
              onClick={(event) => {
                event.stopPropagation();
                onChange(option);
                setOpen(false);
              }}
              className={`block w-full px-3 py-1.5 text-left text-[10px] transition hover:bg-zinc-900 ${
                option === value?.trim() ? "bg-zinc-900/80 text-white" : "text-zinc-300"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
