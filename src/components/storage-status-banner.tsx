"use client";

import { useEffect, useState } from "react";

import { isSupabaseConfigured } from "@/lib/supabase/config";

const DISMISS_STORAGE_KEY = "0-wbs:storage-banner-dismissed";

export function StorageStatusBanner() {
  const configured = isSupabaseConfigured();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (configured) {
      return;
    }

    setDismissed(window.localStorage.getItem(DISMISS_STORAGE_KEY) === "1");
  }, [configured]);

  if (configured || dismissed) {
    return null;
  }

  return (
    <div className="border-b border-amber-900/50 bg-amber-950/30 px-4 py-2 text-center text-xs text-amber-200">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          データ保存先: ブラウザ localStorage（この端末のみ）。チーム共有には Supabase
          連携が必要です（
          <code className="rounded bg-black/40 px-1">docs/SUPABASE_SETUP.md</code>
          ）。
        </span>
        <button
          type="button"
          onClick={() => {
            window.localStorage.setItem(DISMISS_STORAGE_KEY, "1");
            setDismissed(true);
          }}
          className="shrink-0 rounded border border-amber-800/60 px-2 py-0.5 text-[11px] text-amber-100 transition hover:bg-amber-950/50"
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
