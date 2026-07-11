"use client";

import { Fragment, useMemo, useState } from "react";

import { addChild, flattenWbsTree, removeNode, updateNode } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";

type WbsTableProps = {
  root: WbsNode;
  onChange: (root: WbsNode) => void;
};

type WbsTableRowProps = {
  row: ReturnType<typeof flattenWbsTree>[number];
  root: WbsNode;
  onChange: (root: WbsNode) => void;
  isAddingChild: boolean;
  onStartAddChild: () => void;
  onCancelAddChild: () => void;
};

function WbsTableRow({
  row,
  root,
  onChange,
  isAddingChild,
  onStartAddChild,
  onCancelAddChild,
}: WbsTableRowProps) {
  const [draftName, setDraftName] = useState(row.name);
  const [childName, setChildName] = useState("");

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === row.name) {
      setDraftName(row.name);
      return;
    }

    onChange(
      updateNode(root, row.id, (current) => ({
        ...current,
        name: trimmed,
      })),
    );
  };

  const handleAddChild = () => {
    const trimmed = childName.trim();
    if (!trimmed) {
      return;
    }

    onChange(addChild(root, row.id, trimmed));
    setChildName("");
    onCancelAddChild();
  };

  const handleDelete = () => {
    const nextRoot = removeNode(root, row.id);
    if (nextRoot) {
      onChange(nextRoot);
    }
  };

  return (
    <Fragment>
      <tr className="transition hover:bg-zinc-100/70 dark:hover:bg-zinc-900/50">
        <td className="whitespace-nowrap px-4 py-2.5 font-mono text-sm text-zinc-500">
          {row.code}
        </td>
        <td className="px-4 py-2.5">
          <div
            className="flex min-w-0 items-center"
            style={{ paddingLeft: row.depth * 16 }}
          >
            <input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onBlur={handleRename}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.currentTarget.blur();
                }
              }}
              className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm text-zinc-950 outline-none focus:border-zinc-300 dark:text-zinc-50 dark:focus:border-zinc-700"
            />
          </div>
        </td>
        <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
          {row.depth + 1}
        </td>
        <td className="px-4 py-2.5">
          <div className="flex flex-wrap items-center justify-end gap-1">
            <button
              type="button"
              onClick={onStartAddChild}
              className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              子項目を追加
            </button>
            {!row.isRoot && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                削除
              </button>
            )}
          </div>
        </td>
      </tr>

      {isAddingChild && (
        <tr className="bg-zinc-100/60 dark:bg-zinc-900/60">
          <td className="px-4 py-2.5" />
          <td className="px-4 py-2.5" colSpan={2}>
            <div
              className="flex flex-wrap items-center gap-2"
              style={{ paddingLeft: (row.depth + 1) * 16 }}
            >
              <input
                autoFocus
                value={childName}
                onChange={(event) => setChildName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddChild();
                  }
                  if (event.key === "Escape") {
                    onCancelAddChild();
                    setChildName("");
                  }
                }}
                placeholder="新しい作業項目名"
                className="min-w-48 flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none dark:border-zinc-700 dark:bg-zinc-950"
              />
              <button
                type="button"
                onClick={handleAddChild}
                className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                追加
              </button>
              <button
                type="button"
                onClick={() => {
                  onCancelAddChild();
                  setChildName("");
                }}
                className="rounded-md px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
              >
                キャンセル
              </button>
            </div>
          </td>
          <td className="px-4 py-2.5" />
        </tr>
      )}
    </Fragment>
  );
}

export function WbsTable({ root, onChange }: WbsTableProps) {
  const [addingChildForId, setAddingChildForId] = useState<string | null>(null);
  const rows = useMemo(() => flattenWbsTree(root), [root]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-sm">
        <thead className="border-b border-zinc-200 bg-white/80 text-left text-xs font-medium uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/80">
          <tr>
            <th className="px-4 py-3">コード</th>
            <th className="px-4 py-3">作業項目名</th>
            <th className="px-4 py-3">階層</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((row) => (
            <WbsTableRow
              key={row.id}
              row={row}
              root={root}
              onChange={onChange}
              isAddingChild={addingChildForId === row.id}
              onStartAddChild={() => setAddingChildForId(row.id)}
              onCancelAddChild={() => setAddingChildForId(null)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
