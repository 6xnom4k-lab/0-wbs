"use client";

import { useState } from "react";

import { WBS_GANTT_BASE_PADDING, WBS_GANTT_INDENT_STEP } from "@/components/wbs-gantt/constants";
import type { AddMode } from "@/components/wbs-gantt/types";

function getAddPlaceholder(mode: AddMode): string {
  if (mode === "top") {
    return "作業項目名（例: テスト）";
  }

  if (mode === "sibling") {
    return "同レベルの作業項目名";
  }

  return "子項目名（例: ヒアリング実施）";
}

type WbsAddFormProps = {
  mode: AddMode;
  depth: number;
  gridCols: string;
  minWidth: number;
  onSubmit: (name: string) => void;
  onCancel: () => void;
};

export function WbsAddForm({
  mode,
  depth,
  gridCols,
  minWidth,
  onSubmit,
  onCancel,
}: WbsAddFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
    setName("");
  };

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/40">
      <div
        className="grid items-center gap-1 px-1 py-2"
        style={{
          gridTemplateColumns: gridCols,
          minWidth,
          paddingLeft: WBS_GANTT_BASE_PADDING + depth * WBS_GANTT_INDENT_STEP,
        }}
      >
        <div className="col-[1/-1] flex min-w-0 flex-wrap items-center gap-2 pr-2">
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSubmit();
              }
              if (event.key === "Escape") {
                onCancel();
              }
            }}
            placeholder={getAddPlaceholder(mode)}
            className="min-w-40 flex-1 rounded-md border border-zinc-700 bg-black px-2 py-1 text-sm text-zinc-200 outline-none focus:border-zinc-600"
          />
          <button
            type="button"
            onClick={handleSubmit}
            className="rounded-md bg-white px-3 py-1 text-xs font-medium text-black"
          >
            追加
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md px-3 py-1 text-xs font-medium text-zinc-400"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
