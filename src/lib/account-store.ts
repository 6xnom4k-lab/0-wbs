import type { Account, AccountInput } from "@/types/account";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createId } from "@/lib/wbs";

const ACCOUNTS_STORAGE_KEY = "0-wbs:accounts";
const LEGACY_ACCOUNT_STORAGE_KEY = "0-wbs:account";

type AccountRow = {
  id: string;
  display_name: string;
  email: string;
  department: string;
  role: string;
  permission: string;
  created_at: string;
  updated_at: string;
};

function normalizeAccount(account: Account): Account {
  return {
    ...account,
    permission: account.permission ?? "",
  };
}

function readLocalAccounts(): Account[] {
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

function writeLocalAccounts(accounts: Account[]): void {
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

      writeLocalAccounts([migrated]);
    }
  } catch {
    // Ignore invalid legacy data.
  }

  window.localStorage.removeItem(LEGACY_ACCOUNT_STORAGE_KEY);
}

function rowToAccount(row: AccountRow): Account {
  return normalizeAccount({
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    department: row.department,
    role: row.role,
    permission: row.permission,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function accountToRow(account: Account): AccountRow {
  return {
    id: account.id,
    display_name: account.displayName,
    email: account.email,
    department: account.department,
    role: account.role,
    permission: account.permission,
    created_at: account.createdAt,
    updated_at: account.updatedAt,
  };
}

async function listAccountsFromSupabase(): Promise<Account[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_accounts")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as AccountRow[]).map(rowToAccount);
}

async function getAccountFromSupabase(id: string): Promise<Account | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("wbs_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? rowToAccount(data as AccountRow) : null;
}

export async function listAccounts(): Promise<Account[]> {
  if (!isSupabaseConfigured()) {
    return readLocalAccounts().sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
  }

  return listAccountsFromSupabase();
}

export async function getAccount(id: string): Promise<Account | null> {
  if (!isSupabaseConfigured()) {
    return readLocalAccounts().find((account) => account.id === id) ?? null;
  }

  return getAccountFromSupabase(id);
}

export async function createAccount(
  input: AccountInput,
  options?: { permission?: string },
): Promise<Account> {
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

  if (!isSupabaseConfigured()) {
    writeLocalAccounts([account, ...readLocalAccounts()]);
    return account;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_accounts").insert(accountToRow(account));

  if (error) {
    throw new Error(error.message);
  }

  return account;
}

export type AccountBulkImportResult = {
  imported: number;
  errors: string[];
};

export async function importAccounts(
  rows: Array<AccountInput & { permission?: string }>,
): Promise<AccountBulkImportResult> {
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

  if (created.length === 0) {
    return { imported: 0, errors };
  }

  if (!isSupabaseConfigured()) {
    writeLocalAccounts([...created, ...readLocalAccounts()]);
    return { imported: created.length, errors };
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_accounts").insert(created.map(accountToRow));

  if (error) {
    throw new Error(error.message);
  }

  return { imported: created.length, errors };
}

export async function updateAccount(id: string, input: AccountInput): Promise<Account | null> {
  if (!isSupabaseConfigured()) {
    const accounts = readLocalAccounts();
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
    writeLocalAccounts(nextAccounts);
    return updated;
  }

  const existing = await getAccountFromSupabase(id);
  if (!existing) {
    return null;
  }

  const updated: Account = {
    ...existing,
    displayName: input.displayName.trim(),
    email: input.email.trim(),
    department: input.department.trim(),
    role: input.role.trim(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_accounts").upsert(accountToRow(updated));

  if (error) {
    throw new Error(error.message);
  }

  return updated;
}

export async function deleteAccount(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    writeLocalAccounts(readLocalAccounts().filter((account) => account.id !== id));
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("wbs_accounts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
