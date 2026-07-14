"use client";

import { isSupabaseConfigured } from "@/lib/supabase/config";

export function StorageStatusBanner() {
  const configured = isSupabaseConfigured();

  return (
    <div
      className={`border-b px-4 py-2 text-center text-xs ${
        configured
          ? "border-emerald-900/50 bg-emerald-950/30 text-emerald-300"
          : "border-amber-900/50 bg-amber-950/30 text-amber-200"
      }`}
    >
      {configured ? (
        <>データ保存先: Supabase（共有DB）</>
      ) : (
        <>
          データ保存先: ブラウザ localStorage（この端末のみ）。Supabase 連携は{" "}
          <code className="rounded bg-black/40 px-1">docs/SUPABASE_SETUP.md</code> を参照。
        </>
      )}
    </div>
  );
}
