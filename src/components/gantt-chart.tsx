"use client";

import type { WbsNode } from "@/types/wbs";

import { flattenWbsTree } from "@/lib/wbs";

type GanttChartProps = {
  root: WbsNode;
};

export function GanttChart({ root }: GanttChartProps) {
  const rows = flattenWbsTree(root);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="mb-3 grid grid-cols-[180px_1fr] gap-4 border-b border-zinc-800 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          <span>作業項目</span>
          <span>スケジュール（プレビュー）</span>
        </div>

        <ul className="space-y-2">
          {rows.map((row, index) => {
            const offset = row.depth * 12 + (index % 3) * 8;
            const width = Math.max(18, 72 - row.depth * 10 - (index % 4) * 6);

            return (
              <li
                key={row.id}
                className="grid grid-cols-[180px_1fr] items-center gap-4 rounded-md border border-zinc-800/80 bg-zinc-950/60 px-3 py-2"
              >
                <div className="min-w-0" style={{ paddingLeft: row.depth * 12 }}>
                  <p className="truncate text-sm text-zinc-200">{row.name}</p>
                  <p className="font-mono text-xs text-zinc-600">{row.code}</p>
                </div>
                <div className="relative h-8 rounded-md bg-zinc-900">
                  <div
                    className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-zinc-500/80"
                    style={{ left: `${offset}px`, width: `${width}px` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <p className="mt-4 text-xs text-zinc-600">
          開始日・終了日の設定は今後追加予定です。現在は WBS 構成のプレビュー表示です。
        </p>
      </div>
    </div>
  );
}
