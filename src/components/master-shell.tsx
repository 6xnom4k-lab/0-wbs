import Link from "next/link";

import { MasterSidebar } from "@/components/master-sidebar";

type MasterShellProps = {
  children: React.ReactNode;
};

export function MasterShell({ children }: MasterShellProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden shrink-0 md:block">
        <MasterSidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-zinc-200 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
            0-wbs
          </p>
          <div className="mt-3 flex gap-2">
            <MasterMobileNav />
          </div>
        </div>

        <main className="flex-1 bg-white dark:bg-black">{children}</main>
      </div>
    </div>
  );
}

function MasterMobileNav() {
  return (
    <>
      <Link
        href="/"
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800"
      >
        プロジェクト
      </Link>
      <Link
        href="/account"
        className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium dark:border-zinc-800"
      >
        アカウント
      </Link>
    </>
  );
}
