"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { createAccount } from "@/lib/account-store";

const emptyValues = {
  displayName: "",
  email: "",
  department: "",
  role: "",
};

export function AccountCreate() {
  const router = useRouter();

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
            アカウント新規作成
          </h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400">
            新しいアカウント情報を登録します。
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <AccountForm
          initialValues={emptyValues}
          submitLabel="登録"
          onSubmit={(values) => {
            createAccount(values);
            router.push("/account");
          }}
          onCancel={() => router.push("/account")}
        />
      </section>
    </div>
  );
}
