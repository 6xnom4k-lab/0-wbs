import type { Account } from "@/types/account";
import type { WbsProject } from "@/types/wbs";

import { listProjectAssigneeNames } from "@/lib/project-assignees";

export type AssigneeSuggestion = {
  name: string;
  hint?: string;
  source: "project" | "account";
};

export function buildAssigneeSuggestions(
  project: WbsProject,
  accounts: Account[],
): AssigneeSuggestion[] {
  const projectNames = listProjectAssigneeNames(project);
  const projectNameSet = new Set(projectNames);
  const suggestions: AssigneeSuggestion[] = projectNames.map((name) => {
    const assignee = project.assignees.find((item) => item.name === name);
    const account = assignee?.accountId
      ? accounts.find((item) => item.id === assignee.accountId)
      : undefined;

    return {
      name,
      source: "project" as const,
      hint: account
        ? [account.email, account.department].filter(Boolean).join(" / ")
        : undefined,
    };
  });

  for (const account of accounts) {
    const name = account.displayName.trim();
    if (!name || projectNameSet.has(name)) {
      continue;
    }

    suggestions.push({
      name,
      source: "account",
      hint: [account.email, account.department].filter(Boolean).join(" / "),
    });
  }

  return suggestions.sort((left, right) => {
    if (left.source !== right.source) {
      return left.source === "project" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "ja");
  });
}

export function assigneeSuggestionNames(suggestions: AssigneeSuggestion[]): string[] {
  return suggestions.map((item) => item.name);
}
