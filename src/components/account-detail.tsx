"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { IconButton } from "@/components/icon-button";
import { EditIcon } from "@/components/icons";
import { getAccount } from "@/lib/account-store";
import { formatAccountDate, displayPermissionValue, getAccountLabel } from "@/lib/account-utils";
import type { Account } from "@/types/account";

type AccountDetailProps = {
  accountId: string;
};

export function AccountDetail({ accountId }: AccountDetailProps) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const storedAccount = await getAccount(accountId);
      if (!storedAccount) {
        router.replace("/account");
        return;
      }

      setAccount(storedAccount);
      setIsReady(true);
    })();
  }, [accountId, router]);

  if (!isReady || !account) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <Link
          href="/account"
          className="inline-flex text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← アカウント一覧へ戻る
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              {getAccountLabel(account.displayName, account.email)}
            </h2>
            <p className="text-base text-zinc-600 dark:text-zinc-400">
              アカウント情報の確認
            </p>
          </div>
          <IconButton
            label="アカウントを編集"
            href={`/account/${account.id}/edit`}
            tone="primary"
          >
            <EditIcon />
          </IconButton>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-zinc-500">表示名</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {account.displayName || "未設定"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">メールアドレス</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {account.email || "未設定"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">部署</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {account.department || "未設定"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">役職</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {account.role || "未設定"}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">権限</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-zinc-400 dark:bg-zinc-900 dark:text-zinc-500">
                {displayPermissionValue(account.permission)}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">アカウント ID</dt>
            <dd className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-200">
              {account.id}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">登録日時</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {formatAccountDate(account.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">最終更新</dt>
            <dd className="mt-1 text-base text-zinc-900 dark:text-zinc-100">
              {formatAccountDate(account.updatedAt)}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
