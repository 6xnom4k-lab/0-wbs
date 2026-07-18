"use client";

import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/icon-button";
import {
  DeleteIcon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  PlusIcon,
  SubItemPlusIcon,
} from "@/components/icons";

type WbsRowActionsProps = {
  nodeId: string;
  rowName: string;
  hasNotes: boolean;
  isActive: boolean;
  canAddChild: boolean;
  onOpenTask: (nodeId: string) => void;
  onAddChild: () => void;
  onAddSibling: () => void;
  onDelete: () => void;
};

export function WbsRowActions({
  nodeId,
  rowName,
  hasNotes,
  isActive,
  canAddChild,
  onOpenTask,
  onAddChild,
  onAddSibling,
  onDelete,
}: WbsRowActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  const visibilityClass =
    isActive || menuOpen
      ? "opacity-100"
      : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100";

  return (
    <div
      className={`flex shrink-0 items-center gap-0.5 transition-opacity ${visibilityClass}`}
      ref={menuRef}
    >
      <div className="hidden items-center gap-0.5 sm:flex">
        <IconButton label={`${rowName} の作業ページを開く`} onClick={() => onOpenTask(nodeId)}>
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </IconButton>
        {hasNotes && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/80"
            title="作業記録あり"
          />
        )}
        {canAddChild && (
          <IconButton label="子項目を追加" onClick={onAddChild}>
            <SubItemPlusIcon className="h-3.5 w-3.5" />
          </IconButton>
        )}
        <IconButton label="同レベルに追加" onClick={onAddSibling}>
          <PlusIcon className="h-3.5 w-3.5" />
        </IconButton>
        <IconButton label={`${rowName} を削除`} tone="danger" onClick={onDelete}>
          <DeleteIcon className="h-3.5 w-3.5" />
        </IconButton>
      </div>

      <div className="relative sm:hidden">
        <IconButton
          label={`${rowName} の操作`}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <MoreHorizontalIcon className="h-4 w-4" />
        </IconButton>

        {menuOpen && (
          <div className="absolute right-0 top-full z-30 mt-1 min-w-36 overflow-hidden rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onOpenTask(nodeId);
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5 shrink-0" />
              作業ページを開く
            </button>
            {canAddChild && (
              <button
                type="button"
                onClick={() => {
                  onAddChild();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
              >
                <SubItemPlusIcon className="h-3.5 w-3.5 shrink-0" />
                子項目を追加
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                onAddSibling();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
            >
              <PlusIcon className="h-3.5 w-3.5 shrink-0" />
              同レベルに追加
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                setMenuOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/30"
            >
              <DeleteIcon className="h-3.5 w-3.5 shrink-0" />
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
