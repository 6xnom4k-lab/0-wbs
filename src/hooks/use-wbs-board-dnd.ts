"use client";

import { useMemo, useState } from "react";

import type { DropPosition, DropTarget } from "@/components/wbs-gantt/types";
import { canDropNode, flattenWbsBoard, moveNode } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";

export function useWbsBoardDnD(root: WbsNode, onChange: (root: WbsNode) => void) {
  const [dragSourceId, setDragSourceId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());

  const visibleRows = useMemo(
    () => flattenWbsBoard(root, collapsedIds),
    [root, collapsedIds],
  );

  const canDropInsideById = useMemo(() => {
    if (!dragSourceId) {
      return new Map<string, boolean>();
    }

    return new Map(
      visibleRows.map((row) => [row.id, canDropNode(root, dragSourceId, row.id, "inside")]),
    );
  }, [dragSourceId, root, visibleRows]);

  const handleDragStart = (nodeId: string) => {
    setDragSourceId(nodeId);
  };

  const handleDragEnd = () => {
    setDragSourceId(null);
    setDropTarget(null);
  };

  const handleDragOverRow = (targetId: string, position: DropPosition) => {
    if (!dragSourceId || dragSourceId === targetId) {
      setDropTarget(null);
      return;
    }

    if (!canDropNode(root, dragSourceId, targetId, position)) {
      setDropTarget(null);
      return;
    }

    setDropTarget({ id: targetId, position });
  };

  const handleDropRow = (targetId: string, position: DropPosition) => {
    if (!dragSourceId || dragSourceId === targetId) {
      handleDragEnd();
      return;
    }

    if (!canDropNode(root, dragSourceId, targetId, position)) {
      handleDragEnd();
      return;
    }

    onChange(moveNode(root, dragSourceId, targetId, position));

    if (position === "inside") {
      setCollapsedIds((current) => {
        const next = new Set(current);
        next.delete(targetId);
        return next;
      });
    }

    handleDragEnd();
  };

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleCollapseAll = () => {
    const next = new Set<string>();
    for (const child of root.children) {
      if (child.children.length > 0) {
        next.add(child.id);
      }
    }
    setCollapsedIds(next);
  };

  const handleExpandAll = () => {
    setCollapsedIds(new Set());
  };

  return {
    dragSourceId,
    dropTarget,
    collapsedIds,
    canDropInsideById,
    visibleRows,
    handleDragStart,
    handleDragEnd,
    handleDragOverRow,
    handleDropRow,
    handleToggleCollapse,
    handleCollapseAll,
    handleExpandAll,
  };
}
