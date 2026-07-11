export function formatAccountDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAccountTableDate(value: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export function getAccountLabel(displayName: string, email: string): string {
  if (displayName) {
    return displayName;
  }

  if (email) {
    return email;
  }

  return "名称未設定";
}

export function matchesAccountQuery(
  account: {
    displayName: string;
    email: string;
    department: string;
    role: string;
  },
  query: string,
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return [account.displayName, account.email, account.department, account.role]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

export function displayCellValue(value: string): string {
  return value.trim() || "—";
}

export function displayPermissionValue(permission: string): string {
  return permission.trim() || "未設定";
}
