"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FolderIcon, SearchIcon, UsersIcon } from "@/components/icons";

const menuItems = [
  {
    href: "/",
    label: "プロジェクト",
    icon: FolderIcon,
  },
  {
    href: "/account",
    label: "アカウント",
    icon: UsersIcon,
  },
] as const;

export function MasterSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-60 flex-col border-r border-zinc-800 bg-black text-zinc-300">
      <div className="border-b border-zinc-800 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400 text-xs font-bold text-black">
            0
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">0-wbs</p>
            <p className="truncate text-xs text-zinc-500">マスター</p>
          </div>
        </div>
      </div>

      <div className="px-3 py-3">
        <label className="relative block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            readOnly
            placeholder="検索..."
            className="w-full cursor-default rounded-md border border-zinc-800 bg-zinc-950 px-9 py-2 text-xs text-zinc-400 outline-none"
          />
          <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">
            /
          </span>
        </label>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {menuItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 px-4 py-3">
        <p className="text-xs text-zinc-500">ワークスペース</p>
        <p className="mt-1 truncate text-sm text-zinc-300">0-wbs</p>
      </div>
    </aside>
  );
}
