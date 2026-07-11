import type { ReactNode } from "react";

type ViewModeToggleOption<T extends string> = {
  value: T;
  label: string;
  icon: ReactNode;
};

type ViewModeToggleProps<T extends string> = {
  value: T;
  options: ViewModeToggleOption<T>[];
  onChange: (value: T) => void;
  tone?: "dark" | "light";
};

const toneClasses = {
  dark: {
    container: "border-zinc-800",
    active: "bg-white text-black",
    inactive: "text-zinc-400 hover:text-zinc-200",
  },
  light: {
    container: "border-zinc-200 dark:border-zinc-700",
    active: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
    inactive:
      "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
  },
};

export function ViewModeToggle<T extends string>({
  value,
  options,
  onChange,
  tone = "dark",
}: ViewModeToggleProps<T>) {
  const classes = toneClasses[tone];

  return (
    <div
      className={`flex items-center rounded-lg border p-1 ${classes.container}`}
      role="group"
      aria-label="表示形式"
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            title={option.label}
            aria-pressed={isActive}
            onClick={() => onChange(option.value)}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition ${
              isActive ? classes.active : classes.inactive
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
