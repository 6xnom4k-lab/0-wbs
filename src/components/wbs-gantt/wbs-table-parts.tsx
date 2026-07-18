import { GANTT_HEADER_HEIGHT } from "@/lib/gantt-utils";
import { getVisibleWbsColumns } from "@/lib/wbs-table-config";

type WbsTableHeaderProps = {
  gridCols: string;
  minWidth: number;
  showOptionalColumns: boolean;
};

export function WbsTableHeader({ gridCols, minWidth, showOptionalColumns }: WbsTableHeaderProps) {
  const columns = getVisibleWbsColumns(showOptionalColumns);

  return (
    <div
      className="grid shrink-0 items-center border-b border-zinc-800 bg-black/40 py-1.5 text-xs font-medium leading-4 text-zinc-500"
      style={{
        gridTemplateColumns: gridCols,
        minHeight: GANTT_HEADER_HEIGHT,
        minWidth,
      }}
    >
      {columns.map((column) => (
        <span
          key={column.id}
          className={`px-1 ${column.align === "center" ? "text-center" : ""}`}
        >
          {column.label}
        </span>
      ))}
    </div>
  );
}

export function WbsMetaCell({
  value,
  className = "",
}: {
  value?: string;
  className?: string;
}) {
  if (!value) {
    return <span className={`px-1 text-xs text-zinc-700 ${className}`}>—</span>;
  }

  return (
    <span
      className={`block truncate px-1 text-xs leading-4 text-zinc-400 ${className}`}
      title={value}
    >
      {value}
    </span>
  );
}
