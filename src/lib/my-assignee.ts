export const MY_ASSIGNEE_STORAGE_KEY = "0-wbs:my-assignee-name";

export function readMyAssigneeName(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(MY_ASSIGNEE_STORAGE_KEY)?.trim() ?? "";
}

export function writeMyAssigneeName(name: string): void {
  window.localStorage.setItem(MY_ASSIGNEE_STORAGE_KEY, name.trim());
}
