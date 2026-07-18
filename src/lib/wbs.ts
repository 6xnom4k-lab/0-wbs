import type { WbsNode, WbsProject, WbsTaskStatus } from "@/types/wbs";

/** 親=0, 子=1, 孫=2 の3階層まで */
export const WBS_MAX_DEPTH = 2;

export type WbsFlatRow = {
  id: string;
  code: string;
  name: string;
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
  isCollapsed: boolean;
  hiddenCount: number;
  canAddChild: boolean;
  parentId: string;
  description?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  scheduledAt?: string;
  scheduledEndAt?: string;
  status?: WbsTaskStatus;
  effort?: number;
  notes?: string;
};

export function flattenWbsTree(
  node: WbsNode,
  depth = 0,
  collapsedIds: ReadonlySet<string> = new Set(),
  parentId = "",
): WbsFlatRow[] {
  const hasChildren = node.children.length > 0;
  const isCollapsed = collapsedIds.has(node.id);

  const rows: WbsFlatRow[] = [
    {
      id: node.id,
      code: node.code,
      name: node.name,
      depth,
      isRoot: depth === 0,
      hasChildren,
      isCollapsed,
      hiddenCount: isCollapsed ? countNodes(node) - 1 : 0,
      canAddChild: depth < WBS_MAX_DEPTH,
      parentId,
      description: node.description,
      assignee: node.assignee,
      startDate: node.startDate,
      endDate: node.endDate,
      scheduledAt: node.scheduledAt,
      scheduledEndAt: node.scheduledEndAt,
      status: node.status,
      effort: node.effort,
      notes: node.notes,
    },
  ];

  if (!isCollapsed) {
    for (const child of node.children) {
      rows.push(...flattenWbsTree(child, depth + 1, collapsedIds, node.id));
    }
  }

  return rows;
}

export function flattenWbsBoard(
  root: WbsNode,
  collapsedIds: ReadonlySet<string> = new Set(),
): WbsFlatRow[] {
  const rows: WbsFlatRow[] = [];

  for (const child of root.children) {
    rows.push(...flattenWbsTree(child, 0, collapsedIds, root.id));
  }

  return rows;
}

export function createId(): string {
  return crypto.randomUUID();
}

export function createNode(name: string, code = "1"): WbsNode {
  return {
    id: createId(),
    code,
    name,
    children: [],
  };
}

export function createProject(name: string): WbsProject {
  const now = new Date().toISOString();

  return {
    id: createId(),
    name,
    root: createHiddenRoot(name),
    assignees: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function createHiddenRoot(name: string): WbsNode {
  return {
    id: createId(),
    code: "0",
    name,
    children: [],
  };
}

export function countNodes(node: WbsNode): number {
  if (node.code === "0") {
    return node.children.reduce((count, child) => count + countNodes(child), 0);
  }

  return node.children.reduce((count, child) => count + countNodes(child), 1);
}

export function touchProject(project: WbsProject): WbsProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
  };
}

export function updateNode(
  node: WbsNode,
  id: string,
  updater: (current: WbsNode) => WbsNode,
): WbsNode {
  if (node.id === id) {
    return updater(node);
  }

  return {
    ...node,
    children: node.children.map((child) => updateNode(child, id, updater)),
  };
}

export function removeNode(node: WbsNode, id: string): WbsNode | null {
  if (node.id === id) {
    return null;
  }

  return {
    ...node,
    children: node.children
      .map((child) => removeNode(child, id))
      .filter((child): child is WbsNode => child !== null),
  };
}

export function deleteBoardNode(tree: WbsNode, id: string): WbsNode {
  const removed = removeNode(tree, id);
  return renumberFromRoot(removed ?? tree);
}

export function hasDescendants(node: WbsNode): boolean {
  return node.children.length > 0;
}

export function getNodeDepth(tree: WbsNode, nodeId: string): number | null {
  if (tree.id === nodeId) {
    return tree.code === "0" ? -1 : null;
  }

  function walk(node: WbsNode, depth: number): number | null {
    if (node.id === nodeId) {
      return depth;
    }

    for (const child of node.children) {
      const found = walk(child, depth + 1);
      if (found !== null) {
        return found;
      }
    }

    return null;
  }

  for (const child of tree.children) {
    const found = walk(child, 0);
    if (found !== null) {
      return found;
    }
  }

  return null;
}

export function canAddChildToNode(tree: WbsNode, parentId: string): boolean {
  const depth = getNodeDepth(tree, parentId);
  if (depth === null) {
    return false;
  }

  return depth < WBS_MAX_DEPTH;
}

export function clampTreeDepth(node: WbsNode, depth: number): WbsNode {
  if (depth >= WBS_MAX_DEPTH) {
    return { ...node, children: [] };
  }

  return {
    ...node,
    children: node.children.map((child) => clampTreeDepth(child, depth + 1)),
  };
}

export function getParentId(tree: WbsNode, nodeId: string): string | null {
  if (tree.id === nodeId) {
    return null;
  }

  for (const child of tree.children) {
    if (child.id === nodeId) {
      return tree.id;
    }

    const found = getParentId(child, nodeId);
    if (found) {
      return found;
    }
  }

  return null;
}

export function isDescendantOf(
  tree: WbsNode,
  ancestorId: string,
  descendantId: string,
): boolean {
  if (ancestorId === descendantId) {
    return false;
  }

  const ancestor = findNode(tree, ancestorId);
  if (!ancestor) {
    return false;
  }

  return findNode(ancestor, descendantId) !== null;
}

export function getSubtreeHeight(node: WbsNode): number {
  if (node.children.length === 0) {
    return 0;
  }

  return 1 + Math.max(...node.children.map(getSubtreeHeight));
}

export function canMoveNodeToParent(
  tree: WbsNode,
  sourceId: string,
  targetParentId: string,
): boolean {
  if (sourceId === targetParentId) {
    return false;
  }

  if (isDescendantOf(tree, sourceId, targetParentId)) {
    return false;
  }

  if (!canAddChildToNode(tree, targetParentId)) {
    return false;
  }

  const sourceNode = findNode(tree, sourceId);
  if (!sourceNode) {
    return false;
  }

  const targetParentDepth = getNodeDepth(tree, targetParentId);
  if (targetParentDepth === null) {
    return false;
  }

  const newSourceDepth = targetParentDepth + 1;
  const deepestAfterMove = newSourceDepth + getSubtreeHeight(sourceNode);

  return deepestAfterMove <= WBS_MAX_DEPTH;
}

export function canDropNode(
  tree: WbsNode,
  sourceId: string,
  targetId: string,
  position: "before" | "after" | "inside",
): boolean {
  if (sourceId === targetId) {
    return false;
  }

  if (isDescendantOf(tree, sourceId, targetId)) {
    return false;
  }

  if (position === "inside") {
    return canMoveNodeToParent(tree, sourceId, targetId);
  }

  const targetParentId = getParentId(tree, targetId);
  if (!targetParentId) {
    return false;
  }

  return canMoveNodeToParent(tree, sourceId, targetParentId);
}

function extractNode(
  tree: WbsNode,
  nodeId: string,
): { tree: WbsNode; node: WbsNode | null } {
  const node = findNode(tree, nodeId);
  if (!node) {
    return { tree, node: null };
  }

  const withoutNode = removeNode(tree, nodeId);
  return {
    tree: withoutNode ?? tree,
    node,
  };
}

export function moveNode(
  tree: WbsNode,
  sourceId: string,
  targetId: string,
  position: "before" | "after" | "inside",
): WbsNode {
  if (sourceId === targetId || !canDropNode(tree, sourceId, targetId, position)) {
    return tree;
  }

  if (position === "inside") {
    const { tree: withoutSource, node: sourceNode } = extractNode(tree, sourceId);
    if (!sourceNode) {
      return tree;
    }

    const movedNode = sourceNode;

    function appendToParent(node: WbsNode): WbsNode {
      if (node.id === targetId) {
        return {
          ...node,
          children: [...node.children, movedNode],
        };
      }

      return {
        ...node,
        children: node.children.map(appendToParent),
      };
    }

    return renumberFromRoot(appendToParent(withoutSource));
  }

  const sourceParentId = getParentId(tree, sourceId);
  const targetParentId = getParentId(tree, targetId);

  if (sourceParentId && targetParentId && sourceParentId === targetParentId) {
    return reorderSiblings(tree, sourceId, targetId, position);
  }

  const { tree: withoutSource, node: sourceNode } = extractNode(tree, sourceId);
  if (!sourceNode || !targetParentId) {
    return tree;
  }

  const movedNode = sourceNode;

  function insertAsSibling(node: WbsNode): WbsNode {
    if (node.id !== targetParentId) {
      return {
        ...node,
        children: node.children.map(insertAsSibling),
      };
    }

    const children = [...node.children];
    const targetIndex = children.findIndex((child) => child.id === targetId);
    if (targetIndex === -1) {
      return node;
    }

    const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
    children.splice(insertIndex, 0, movedNode);

    return {
      ...node,
      children,
    };
  }

  return renumberFromRoot(insertAsSibling(withoutSource));
}

export function reorderSiblings(
  tree: WbsNode,
  sourceId: string,
  targetId: string,
  position: "before" | "after",
): WbsNode {
  if (sourceId === targetId) {
    return tree;
  }

  const parentId = getParentId(tree, sourceId);
  if (!parentId || getParentId(tree, targetId) !== parentId) {
    return tree;
  }

  function reorderInParent(node: WbsNode): WbsNode {
    if (node.id !== parentId) {
      return {
        ...node,
        children: node.children.map(reorderInParent),
      };
    }

    const children = [...node.children];
    const sourceIndex = children.findIndex((child) => child.id === sourceId);
    const targetIndex = children.findIndex((child) => child.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1) {
      return node;
    }

    const [moved] = children.splice(sourceIndex, 1);
    let insertIndex = position === "before" ? targetIndex : targetIndex + 1;

    if (sourceIndex < targetIndex) {
      insertIndex -= 1;
    }

    children.splice(insertIndex, 0, moved);

    return {
      ...node,
      children,
    };
  }

  return renumberFromRoot(reorderInParent(tree));
}

export function findNodePath(tree: WbsNode, nodeId: string): WbsNode[] | null {
  function walk(node: WbsNode, path: WbsNode[]): WbsNode[] | null {
    const nextPath = [...path, node];

    if (node.id === nodeId) {
      return nextPath;
    }

    for (const child of node.children) {
      const found = walk(child, nextPath);
      if (found) {
        return found;
      }
    }

    return null;
  }

  for (const child of tree.children) {
    const found = walk(child, []);
    if (found) {
      return found;
    }
  }

  return null;
}

export function getDepthLabel(depth: number): string {
  if (depth === 0) {
    return "親";
  }

  if (depth === 1) {
    return "子";
  }

  return "孫";
}

export function findNode(tree: WbsNode, id: string): WbsNode | null {
  if (tree.id === id) {
    return tree;
  }

  for (const child of tree.children) {
    const found = findNode(child, id);
    if (found) {
      return found;
    }
  }

  return null;
}

export function addChild(tree: WbsNode, parentId: string, childName: string): WbsNode {
  if (!canAddChildToNode(tree, parentId)) {
    return tree;
  }

  function insert(node: WbsNode): WbsNode {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...node.children, createNode(childName, "tmp")],
      };
    }

    return {
      ...node,
      children: node.children.map(insert),
    };
  }

  return renumberFromRoot(insert(tree));
}

export function addSibling(tree: WbsNode, nodeId: string, siblingName: string): WbsNode {
  function insert(node: WbsNode): WbsNode {
    const index = node.children.findIndex((child) => child.id === nodeId);
    if (index !== -1) {
      const nextChildren = [...node.children];
      nextChildren.splice(index + 1, 0, createNode(siblingName, "tmp"));
      return { ...node, children: nextChildren };
    }

    return {
      ...node,
      children: node.children.map(insert),
    };
  }

  return renumberFromRoot(insert(tree));
}

export function renumberFromRoot(root: WbsNode): WbsNode {
  return {
    ...root,
    code: "0",
    children: root.children.map((child, index) => renumberTree(child, String(index + 1))),
  };
}

export function normalizeProjectRoot(root: WbsNode, projectName: string): WbsNode {
  const normalized: WbsNode = {
    ...root,
    code: "0",
    name: projectName,
    children: root.children.map((child) => clampTreeDepth(child, 0)),
  };

  return renumberFromRoot(normalized);
}

export function renumberTree(node: WbsNode, prefix = "1"): WbsNode {
  return {
    ...node,
    code: prefix,
    children: node.children.map((child, index) =>
      renumberTree(child, `${prefix}.${index + 1}`),
    ),
  };
}
