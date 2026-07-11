import type { WbsNode, WbsProject } from "@/types/wbs";

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
    root: createNode(name, "1"),
    createdAt: now,
    updatedAt: now,
  };
}

export function countNodes(node: WbsNode): number {
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

export function addChild(node: WbsNode, parentId: string, childName: string): WbsNode {
  if (node.id === parentId) {
    const nextIndex = node.children.length + 1;
    const childCode = `${node.code}.${nextIndex}`;

    return {
      ...node,
      children: [...node.children, createNode(childName, childCode)],
    };
  }

  return {
    ...node,
    children: node.children.map((child) => addChild(child, parentId, childName)),
  };
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
