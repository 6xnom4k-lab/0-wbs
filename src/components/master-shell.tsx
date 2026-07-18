import Link from "next/link";

import { MasterSidebar } from "@/components/master-sidebar";
import { StorageStatusBanner } from "@/components/storage-status-banner";

type MasterShellProps = {
  children: React.ReactNode;
};

export function MasterShell({ children }: MasterShellProps) {
  return (
    <div className="flex min-h-screen bg-black text-zinc-100">
      <div className="hidden shrink-0 md:block">
        <MasterSidebar />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="border-b border-zinc-800 bg-black px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-zinc-100 to-zinc-400 text-[10px] font-bold text-black">
              0
            </div>
            <p className="text-sm font-medium text-white">0-wbs</p>
          </div>
          <div className="mt-3 flex gap-2">
            <MasterMobileNav />
          </div>
        </div>

        <StorageStatusBanner />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

function MasterMobileNav() {
  return (
    <>
      <Link
        href="/"
        className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300"
      >
        プロジェクト
      </Link>
      <Link
        href="/account"
        className="rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300"
      >
        アカウント
      </Link>
    </>
  );
}
