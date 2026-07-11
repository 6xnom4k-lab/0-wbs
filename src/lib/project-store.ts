import { countNodes } from "@/lib/wbs";
import type { WbsProject, WbsProjectSummary } from "@/types/wbs";

const STORAGE_KEY = "0-wbs:projects";

function readProjects(): WbsProject[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as WbsProject[];
  } catch {
    return [];
  }
}

function writeProjects(projects: WbsProject[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function listProjects(): WbsProject[] {
  return readProjects().sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function listProjectSummaries(): WbsProjectSummary[] {
  return listProjects().map((project) => ({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    nodeCount: countNodes(project.root),
  }));
}

export function getProject(id: string): WbsProject | null {
  return readProjects().find((project) => project.id === id) ?? null;
}

export function saveProject(project: WbsProject): void {
  const projects = readProjects();
  const index = projects.findIndex((item) => item.id === project.id);

  if (index === -1) {
    writeProjects([project, ...projects]);
    return;
  }

  const nextProjects = [...projects];
  nextProjects[index] = project;
  writeProjects(nextProjects);
}

export function deleteProject(id: string): void {
  writeProjects(readProjects().filter((project) => project.id !== id));
}
