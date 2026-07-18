export const WBS_OPTIONAL_COLUMNS_STORAGE_KEY = "0-wbs:wbs-optional-columns-visible";

export const WBS_TABLE_MIN_WIDTH_COMPACT = 560;
export const WBS_TABLE_MIN_WIDTH_FULL = 720;

export type WbsColumnId =
  | "drag"
  | "name"
  | "description"
  | "assignee"
  | "startDate"
  | "endDate"
  | "status"
  | "progress"
  | "effort"
  | "notes"
  | "actions";

export type WbsColumnDef = {
  id: WbsColumnId;
  label: string;
  width: string;
  optional: boolean;
  align?: "left" | "center";
};

export const WBS_COLUMNS: WbsColumnDef[] = [
  { id: "drag", label: "", width: "28px", optional: false },
  { id: "name", label: "作業項目", width: "minmax(180px,2fr)", optional: false },
  { id: "description", label: "詳細", width: "minmax(96px,1fr)", optional: true },
  { id: "assignee", label: "担当", width: "64px", optional: false },
  { id: "startDate", label: "開始", width: "76px", optional: false },
  { id: "endDate", label: "終了", width: "76px", optional: false },
  { id: "status", label: "状態", width: "72px", optional: false },
  { id: "progress", label: "進捗", width: "minmax(88px,1fr)", optional: true },
  { id: "effort", label: "工数", width: "40px", optional: true, align: "center" },
  { id: "notes", label: "備考", width: "minmax(72px,0.8fr)", optional: true },
  { id: "actions", label: "", width: "68px", optional: false },
];

export function getVisibleWbsColumns(showOptionalColumns: boolean): WbsColumnDef[] {
  return WBS_COLUMNS.filter((column) => !column.optional || showOptionalColumns);
}

export function readOptionalColumnsVisible(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(WBS_OPTIONAL_COLUMNS_STORAGE_KEY) === "1";
}

export function writeOptionalColumnsVisible(visible: boolean): void {
  window.localStorage.setItem(WBS_OPTIONAL_COLUMNS_STORAGE_KEY, visible ? "1" : "0");
}

export function buildWbsGridCols(showOptionalColumns: boolean): string {
  return getVisibleWbsColumns(showOptionalColumns)
    .map((column) => column.width)
    .join(" ");
}

export function getWbsTableMinWidth(showOptionalColumns: boolean): number {
  return showOptionalColumns ? WBS_TABLE_MIN_WIDTH_FULL : WBS_TABLE_MIN_WIDTH_COMPACT;
}

export function getWbsColumnLabel(id: WbsColumnId): string {
  return WBS_COLUMNS.find((column) => column.id === id)?.label ?? "";
}
