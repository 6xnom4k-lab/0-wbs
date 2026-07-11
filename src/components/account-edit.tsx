"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AccountForm } from "@/components/account-form";
import { getAccount, updateAccount } from "@/lib/account-store";
import { getAccountLabel } from "@/lib/account-utils";
import type { Account } from "@/types/account";

type AccountEditProps = {
  accountId: string;
};

export function AccountEdit({ accountId }: AccountEditProps) {
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedAccount = getAccount(accountId);
    if (!storedAccount) {
      router.replace("/account");
      return;
    }

    setAccount(storedAccount);
    setIsReady(true);
  }, [accountId, router]);

  if (!isReady || !account) {
    return (
      <div className="px-6 py-10">
        <p className="text-sm text-zinc-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <header className="space-y-4">
        <Link
          href="/account"
          className="inline-flex text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          ← アカウント一覧へ戻る
        </Link>

        <div className="space-y-2">
          <h2 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {getAccountLabel(account.displayName, account.email)} を編集
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            アカウント情報を更新します。
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <AccountForm
          initialValues={{
            displayName: account.displayName,
            email: account.email,
            department: account.department,
            role: account.role,
          }}
          submitLabel="更新"
          onSubmit={(values) => {
            const updated = updateAccount(account.id, values);
            if (updated) {
              router.push("/account");
            }
          }}
          onCancel={() => router.push("/account")}
        />
      </section>
    </div>
  );
}
