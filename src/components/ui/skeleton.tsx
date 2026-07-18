type SkeletonProps = {
  className?: string;
};

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-zinc-800/80 ${className}`}
    />
  );
}

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  label?: string;
};

export function TableSkeleton({ rows = 3, columns = 5, label = "読み込み中" }: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
      className="divide-y divide-zinc-800"
    >
      <div className="grid gap-3 border-b border-zinc-800 bg-black/40 px-4 py-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={`head-${index}`} className="h-3" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-3 px-4 py-4"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className={`h-4 ${colIndex === 1 ? "col-span-2" : ""}`}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function WbsBoardSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="WBS を読み込み中"
      className="overflow-hidden rounded-lg border border-zinc-800"
    >
      <div className="border-b border-zinc-800 bg-zinc-950 px-4 py-3">
        <Skeleton className="h-3 w-2/3 max-w-md" />
      </div>
      <TableSkeleton rows={3} columns={6} label="WBS を読み込み中" />
      <span className="sr-only">WBS を読み込み中</span>
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="タスク一覧を読み込み中"
      className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
    >
      <TableSkeleton rows={3} columns={5} label="タスク一覧を読み込み中" />
      <span className="sr-only">タスク一覧を読み込み中</span>
    </div>
  );
}
