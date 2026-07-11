"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  {
    href: "/",
    label: "プロジェクト管理",
    description: "プロジェクトの作成・一覧・削除",
  },
  {
    href: "/account",
    label: "アカウント管理",
    description: "プロフィール情報の確認・編集",
  },
] as const;

export function MasterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 px-5 py-6 dark:border-zinc-800">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          0-wbs
        </p>
        <h1 className="mt-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          マスター管理
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-2 p-4">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-3 transition ${
                isActive
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }`}
            >
              <span className="block text-sm font-medium">{item.label}</span>
              <span
                className={`mt-1 block text-xs ${
                  isActive
                    ? "text-zinc-300 dark:text-zinc-600"
                    : "text-zinc-500 dark:text-zinc-500"
                }`}
              >
                {item.description}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
