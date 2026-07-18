import type { WbsFlatRow } from "@/lib/wbs";
import type { WbsNode } from "@/types/wbs";

export type AddMode = "top" | "child" | "sibling";

export type PendingAdd = {
  mode: AddMode;
  targetId: string;
};

export type DropPosition = "before" | "after" | "inside";

export type DropTarget = {
  id: string;
  position: DropPosition;
};

export type WbsGanttBoardProps = {
  root: WbsNode;
  assigneeOptions: string[];
  onChange: (root: WbsNode) => void;
  onOpenTask: (nodeId: string) => void;
};

export type WbsGanttRowProps = {
  row: WbsFlatRow;
  rowIndex: number;
  root: WbsNode;
  assigneeOptions: string[];
  onChange: (root: WbsNode) => void;
  pendingAdd: PendingAdd | null;
  onStartAdd: (mode: AddMode, targetId: string) => void;
  onCancelAdd: () => void;
  onToggleCollapse: (nodeId: string) => void;
  dragSourceId: string | null;
  dropTarget: DropTarget | null;
  canDropInside: boolean;
  onDragStart: (nodeId: string) => void;
  onDragEnd: () => void;
  onDragOverRow: (nodeId: string, position: DropPosition) => void;
  onDropRow: (nodeId: string, position: DropPosition) => void;
  onOpenTask: (nodeId: string) => void;
  gridCols: string;
  tableMinWidth: number;
  showOptionalColumns: boolean;
};
