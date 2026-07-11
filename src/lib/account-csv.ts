import type { Account, AccountInput } from "@/types/account";

export const ACCOUNT_CSV_HEADERS = [
  "表示名",
  "メール",
  "部署",
  "役職",
  "権限",
] as const;

type CsvRow = Record<(typeof ACCOUNT_CSV_HEADERS)[number], string>;

function escapeCsvValue(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (inQuotes && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function normalizeHeader(value: string): string {
  const trimmed = value.trim().replace(/^\uFEFF/, "");
  const aliases: Record<string, (typeof ACCOUNT_CSV_HEADERS)[number]> = {
    表示名: "表示名",
    displayname: "表示名",
    name: "表示名",
    メール: "メール",
    email: "メール",
    "e-mail": "メール",
    部署: "部署",
    department: "部署",
    役職: "役職",
    role: "役職",
    権限: "権限",
    permission: "権限",
  };

  return aliases[trimmed.toLowerCase()] ?? trimmed;
}

function rowToAccountInput(row: CsvRow): AccountInput & { permission: string } {
  return {
    displayName: row.表示名.trim(),
    email: row.メール.trim(),
    department: row.部署.trim(),
    role: row.役職.trim(),
    permission: row.権限.trim(),
  };
}

function isValidImportRow(row: AccountInput): boolean {
  return Boolean(row.displayName.trim() || row.email.trim());
}

export function accountsToCsv(accounts: Account[]): string {
  const lines = [
    ACCOUNT_CSV_HEADERS.join(","),
    ...accounts.map((account) =>
      [
        account.displayName,
        account.email,
        account.department,
        account.role,
        account.permission,
      ]
        .map(escapeCsvValue)
        .join(","),
    ),
  ];

  return `\uFEFF${lines.join("\n")}`;
}

export function downloadAccountsCsv(accounts: Account[], filename = "accounts.csv"): void {
  const csv = accountsToCsv(accounts);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type AccountCsvImportRow = AccountInput & {
  permission: string;
};

export type AccountCsvImportResult = {
  rows: AccountCsvImportRow[];
  errors: string[];
};

export function parseAccountsCsv(content: string): AccountCsvImportResult {
  const normalized = content.replace(/^\uFEFF/, "").trim();
  if (!normalized) {
    return { rows: [], errors: ["CSV ファイルが空です。"] };
  }

  const lines = normalized.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return { rows: [], errors: ["CSV ファイルが空です。"] };
  }

  const headerValues = parseCsvLine(lines[0]).map(normalizeHeader);
  const missingHeaders = ACCOUNT_CSV_HEADERS.filter(
    (header) => !headerValues.includes(header),
  );

  if (missingHeaders.length > 0) {
    return {
      rows: [],
      errors: [`ヘッダーが不足しています: ${missingHeaders.join("、")}`],
    };
  }

  const rows: AccountCsvImportRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, index) => {
    const lineNumber = index + 2;
    const values = parseCsvLine(line);
    const row = {} as CsvRow;

    ACCOUNT_CSV_HEADERS.forEach((header) => {
      const columnIndex = headerValues.indexOf(header);
      row[header] = values[columnIndex]?.trim() ?? "";
    });

    const accountInput = rowToAccountInput(row);
    if (!isValidImportRow(accountInput)) {
      errors.push(`${lineNumber} 行目: 表示名またはメールが必要です。`);
      return;
    }

    rows.push(accountInput);
  });

  return { rows, errors };
}
