import type { Account, AccountInput } from "@/types/account";

import { createId } from "@/lib/wbs";

const ACCOUNTS_STORAGE_KEY = "0-wbs:accounts";
const LEGACY_ACCOUNT_STORAGE_KEY = "0-wbs:account";

function normalizeAccount(account: Account): Account {
  return {
    ...account,
    permission: account.permission ?? "",
  };
}

function readAccounts(): Account[] {
  if (typeof window === "undefined") {
    return [];
  }

  migrateLegacyAccount();

  const raw = window.localStorage.getItem(ACCOUNTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return (JSON.parse(raw) as Account[]).map(normalizeAccount);
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Account[]): void {
  window.localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
}

function migrateLegacyAccount(): void {
  const legacyRaw = window.localStorage.getItem(LEGACY_ACCOUNT_STORAGE_KEY);
  if (!legacyRaw) {
    return;
  }

  try {
    const legacy = JSON.parse(legacyRaw) as Account & { createdAt?: string };
    const hasContent =
      legacy.displayName || legacy.email || legacy.department || legacy.role;

    if (hasContent) {
      const now = new Date().toISOString();
      const migrated: Account = {
        id: legacy.id ?? createId(),
        displayName: legacy.displayName ?? "",
        email: legacy.email ?? "",
        department: legacy.department ?? "",
        role: legacy.role ?? "",
        permission: legacy.permission ?? "",
        createdAt: legacy.createdAt ?? legacy.updatedAt ?? now,
        updatedAt: legacy.updatedAt ?? now,
      };

      writeAccounts([migrated]);
    }
  } catch {
    // Ignore invalid legacy data.
  }

  window.localStorage.removeItem(LEGACY_ACCOUNT_STORAGE_KEY);
}

export function listAccounts(): Account[] {
  return readAccounts().sort(
    (left, right) =>
      new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

export function getAccount(id: string): Account | null {
  return readAccounts().find((account) => account.id === id) ?? null;
}

export function createAccount(
  input: AccountInput,
  options?: { permission?: string },
): Account {
  const now = new Date().toISOString();
  const account: Account = {
    id: createId(),
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    department: input.department.trim(),
    role: input.role.trim(),
    permission: options?.permission?.trim() ?? "",
    createdAt: now,
    updatedAt: now,
  };

  writeAccounts([account, ...readAccounts()]);
  return account;
}

export type AccountBulkImportResult = {
  imported: number;
  errors: string[];
};

export function importAccounts(
  rows: Array<AccountInput & { permission?: string }>,
): AccountBulkImportResult {
  const created: Account[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    if (!row.displayName.trim() && !row.email.trim()) {
      errors.push(`${index + 1} 件目: 表示名またはメールが必要です。`);
      return;
    }

    const now = new Date().toISOString();
    created.push({
      id: createId(),
      displayName: row.displayName.trim(),
      email: row.email.trim(),
      department: row.department.trim(),
      role: row.role.trim(),
      permission: row.permission?.trim() ?? "",
      createdAt: now,
      updatedAt: now,
    });
  });

  if (created.length > 0) {
    writeAccounts([...created, ...readAccounts()]);
  }

  return {
    imported: created.length,
    errors,
  };
}

export function updateAccount(id: string, input: AccountInput): Account | null {
  const accounts = readAccounts();
  const index = accounts.findIndex((account) => account.id === id);

  if (index === -1) {
    return null;
  }

  const updated: Account = {
    ...accounts[index],
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    department: input.department.trim(),
    role: input.role.trim(),
    updatedAt: new Date().toISOString(),
  };

  const nextAccounts = [...accounts];
  nextAccounts[index] = updated;
  writeAccounts(nextAccounts);
  return updated;
}

export function deleteAccount(id: string): void {
  writeAccounts(readAccounts().filter((account) => account.id !== id));
}
