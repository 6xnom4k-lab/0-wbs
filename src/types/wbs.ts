export type WbsNode = {
  id: string;
  code: string;
  name: string;
  children: WbsNode[];
};

export type WbsProject = {
  id: string;
  name: string;
  root: WbsNode;
  createdAt: string;
  updatedAt: string;
};

export type WbsProjectSummary = Pick<
  WbsProject,
  "id" | "name" | "createdAt" | "updatedAt"
> & {
  nodeCount: number;
};
