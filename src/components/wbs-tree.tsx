"use client";

import { useState } from "react";

import { addChild, removeNode, updateNode } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";

type WbsTreeProps = {
  root: WbsNode;
  onChange: (root: WbsNode) => void;
};

type WbsTreeNodeProps = {
  node: WbsNode;
  depth: number;
  onChange: (root: WbsNode) => void;
  root: WbsNode;
};

function WbsTreeNode({ node, depth, onChange, root }: WbsTreeNodeProps) {
  const [draftName, setDraftName] = useState(node.name);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childName, setChildName] = useState("");

  const handleRename = () => {
    const trimmed = draftName.trim();
    if (!trimmed || trimmed === node.name) {
      setDraftName(node.name);
      return;
    }

    onChange(
      updateNode(root, node.id, (current) => ({
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

    onChange(addChild(root, node.id, trimmed));
    setChildName("");
    setIsAddingChild(false);
  };

  const handleDelete = () => {
    const nextRoot = removeNode(root, node.id);
    if (nextRoot) {
      onChange(nextRoot);
    }
  };

  return (
    <li className="space-y-2">
      <div
        className="flex flex-wrap items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        style={{ marginLeft: depth * 20 }}
      >
        <span className="min-w-12 font-mono text-sm text-zinc-500">{node.code}</span>
        <input
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={handleRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="min-w-48 flex-1 rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none focus:border-zinc-300 dark:focus:border-zinc-700"
        />
        <button
          type="button"
          onClick={() => setIsAddingChild(true)}
          className="rounded-md px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          子項目を追加
        </button>
        {depth > 0 && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            削除
          </button>
        )}
      </div>

      {isAddingChild && (
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900/40"
          style={{ marginLeft: (depth + 1) * 20 }}
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
                setIsAddingChild(false);
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
              setIsAddingChild(false);
              setChildName("");
            }}
            className="rounded-md px-3 py-1 text-xs font-medium text-zinc-600 dark:text-zinc-300"
          >
            キャンセル
          </button>
        </div>
      )}

      {node.children.length > 0 && (
        <ul className="space-y-2">
          {node.children.map((child) => (
            <WbsTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onChange={onChange}
              root={root}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function WbsTree({ root, onChange }: WbsTreeProps) {
  return (
    <ul className="space-y-3">
      <WbsTreeNode node={root} depth={0} onChange={onChange} root={root} />
    </ul>
  );
}
