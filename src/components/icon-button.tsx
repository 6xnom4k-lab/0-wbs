import Link from "next/link";

type IconButtonProps = {
  label: string;
  href?: string;
  onClick?: () => void;
  tone?: "default" | "primary" | "danger";
  children: React.ReactNode;
};

const toneClasses = {
  default:
    "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
  primary:
    "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50",
  danger:
    "text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300",
};

export function IconButton({
  label,
  href,
  onClick,
  tone = "default",
  children,
}: IconButtonProps) {
  const className = `inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${toneClasses[tone]}`;

  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={className}>
      {children}
    </button>
  );
}
