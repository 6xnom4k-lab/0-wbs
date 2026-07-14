import { countNodes } from "@/lib/wbs";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { WbsNode, WbsProject, WbsProjectSummary } from "@/types/wbs";

const STORAGE_KEY = "0-wbs:projects";

type ProjectRow = {
  id: string;
  name: string;
  root: WbsNode;
  created_at: string;
  updated_at: string;
};

function readLocalProjects(): WbsProject[] {
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

function writeLocalProjects(projects: WbsProject[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

function rowToProject(row: ProjectRow): WbsProject {
  return {
    id: row.id,
    name: row.name,
    root: row.root,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function projectToRow(project: WbsProject) {
  return {
    id: project.id,
    name: project.name,
    root: project.root,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
  };
}

async function listProjectsFromSupabase(): Promise<WbsProject[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProjectRow[]).map(rowToProject);
}

async function getProjectFromSupabase(id: string): Promise<WbsProject | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_projects")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToProject(data as ProjectRow) : null;
}

async function saveProjectToSupabase(project: WbsProject): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_projects").upsert(projectToRow(project));

  if (error) {
    throw new Error(error.message);
  }
}

async function deleteProjectFromSupabase(id: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_projects").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export function usesSupabaseStorage(): boolean {
  return isSupabaseConfigured();
}

export async function listProjects(): Promise<WbsProject[]> {
  if (!isSupabaseConfigured()) {
    return readLocalProjects().sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }

  return listProjectsFromSupabase();
}

export async function listProjectSummaries(): Promise<WbsProjectSummary[]> {
  const projects = await listProjects();
  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    nodeCount: countNodes(project.root),
  }));
}

export async function getProject(id: string): Promise<WbsProject | null> {
  if (!isSupabaseConfigured()) {
    return readLocalProjects().find((project) => project.id === id) ?? null;
  }

  return getProjectFromSupabase(id);
}

export async function saveProject(project: WbsProject): Promise<void> {
  if (!isSupabaseConfigured()) {
    const projects = readLocalProjects();
    const index = projects.findIndex((item) => item.id === project.id);

    if (index === -1) {
      writeLocalProjects([project, ...projects]);
      return;
    }

    const nextProjects = [...projects];
    nextProjects[index] = project;
    writeLocalProjects(nextProjects);
    return;
  }

  await saveProjectToSupabase(project);
}

export async function deleteProject(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    writeLocalProjects(readLocalProjects().filter((project) => project.id !== id));
    return;
  }

  await deleteProjectFromSupabase(id);
}

export async function migrateLocalProjectsToSupabase(): Promise<number> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }

  const localProjects = readLocalProjects();
  if (localProjects.length === 0) {
    return 0;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("wbs_projects")
    .upsert(localProjects.map(projectToRow));

  if (error) {
    throw new Error(error.message);
  }

  return localProjects.length;
}
