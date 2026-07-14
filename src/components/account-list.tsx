"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { IconButton } from "@/components/icon-button";
import {
  DeleteIcon,
  DownloadIcon,
  EditIcon,
  PlusIcon,
  SearchIcon,
  UploadIcon,
} from "@/components/icons";
import { Pagination } from "@/components/pagination";
import { downloadAccountsCsv, parseAccountsCsv } from "@/lib/account-csv";
import { deleteAccount, importAccounts, listAccounts } from "@/lib/account-store";
import {
  displayCellValue,
  displayPermissionValue,
  formatAccountTableDate,
  getAccountLabel,
  matchesAccountQuery,
} from "@/lib/account-utils";
import { ACCOUNT_PAGE_SIZE, paginateItems } from "@/lib/pagination";
import type { Account } from "@/types/account";

export function AccountList() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isReady, setIsReady] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const refreshAccounts = async () => {
    setAccounts(await listAccounts());
  };

  useEffect(() => {
    void refreshAccounts().finally(() => setIsReady(true));
  }, []);

  const filteredAccounts = useMemo(
    () => accounts.filter((account) => matchesAccountQuery(account, query)),
    [accounts, query],
  );

  const pagination = useMemo(
    () => paginateItems(filteredAccounts, currentPage, ACCOUNT_PAGE_SIZE),
    [filteredAccounts, currentPage],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [query]);

  useEffect(() => {
    if (currentPage > pagination.totalPages) {
      setCurrentPage(pagination.totalPages);
    }
  }, [currentPage, pagination.totalPages]);

  const handleDelete = async (account: Account) => {
    const label = getAccountLabel(account.displayName, account.email);
    const confirmed = window.confirm(`「${label}」を削除しますか？`);
    if (!confirmed) {
      return;
    }

    await deleteAccount(account.id);
    await refreshAccounts();
  };

  const handleExportCsv = () => {
    if (filteredAccounts.length === 0) {
      window.alert("出力対象のアカウントがありません。");
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    downloadAccountsCsv(filteredAccounts, `accounts-${timestamp}.csv`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const content = await file.text();
    const parsed = parseAccountsCsv(content);

    if (parsed.rows.length === 0 && parsed.errors.length > 0) {
      window.alert(parsed.errors.join("\n"));
      return;
    }

    const result = await importAccounts(parsed.rows);
    await refreshAccounts();

    const messages = [`${result.imported} 件を登録しました。`];
    if (parsed.errors.length > 0) {
      messages.push(`スキップ: ${parsed.errors.length} 件`);
    }
    if (result.errors.length > 0) {
      messages.push(`エラー: ${result.errors.length} 件`);
    }

    setImportMessage(messages.join(" "));
    window.alert(
      [
        ...messages,
        ...(parsed.errors.length > 0 ? ["", ...parsed.errors] : []),
        ...(result.errors.length > 0 ? ["", ...result.errors] : []),
      ].join("\n"),
    );
  };

  return (
    <div className="flex w-full flex-col gap-6 px-6 py-8 md:px-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm text-zinc-500">Accounts</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Overview</h1>
          </div>

          <Link
            href="/account/new"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            <PlusIcon />
            Add New
          </Link>
        </header>

        {importMessage && (
          <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {importMessage}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Accounts..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-200 outline-none focus:border-zinc-600"
            />
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              title="一覧をダウンロード"
              className="inline-flex items-center gap-1.5 rounded-md border border-sky-800/60 bg-sky-950/40 px-3 py-2 text-sm font-medium text-sky-300 transition hover:bg-sky-950/70"
            >
              <DownloadIcon className="h-4 w-4" />
              出力
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              title="ファイルから取り込む"
              className="inline-flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-950/70"
            >
              <UploadIcon className="h-4 w-4" />
              一括登録
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
          {filteredAccounts.length > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          )}

          {!isReady ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">読み込み中...</div>
          ) : accounts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              まだアカウントがありません。「新規作成」または「一括登録」から登録してください。
            </div>
          ) : filteredAccounts.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-zinc-500">
              検索条件に一致するアカウントがありません。
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-black/40 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">表示名</th>
                    <th className="px-4 py-3">メール</th>
                    <th className="hidden px-4 py-3 md:table-cell">部署</th>
                    <th className="hidden px-4 py-3 lg:table-cell">役職</th>
                    <th className="hidden px-4 py-3 md:table-cell">権限</th>
                    <th className="px-4 py-3">更新日</th>
                    <th className="px-4 py-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {pagination.items.map((account) => (
                    <tr
                      key={account.id}
                      className="transition hover:bg-zinc-900/50"
                    >
                      <td
                        className="max-w-[12rem] truncate px-4 py-2.5 font-medium text-zinc-100"
                        title={getAccountLabel(account.displayName, account.email)}
                      >
                        {getAccountLabel(account.displayName, account.email)}
                      </td>
                      <td className="max-w-[14rem] truncate px-4 py-2.5 text-zinc-400">
                        {displayCellValue(account.email)}
                      </td>
                      <td className="hidden max-w-[10rem] truncate px-4 py-2.5 text-zinc-400 md:table-cell">
                        {displayCellValue(account.department)}
                      </td>
                      <td className="hidden max-w-[10rem] truncate px-4 py-2.5 text-zinc-400 lg:table-cell">
                        {displayCellValue(account.role)}
                      </td>
                      <td className="hidden px-4 py-2.5 md:table-cell">
                        <span className="inline-flex rounded-full bg-zinc-900 px-2.5 py-1 text-xs text-zinc-500">
                          {displayPermissionValue(account.permission)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-zinc-500">
                        {formatAccountTableDate(account.updatedAt)}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <IconButton
                            label={`${getAccountLabel(account.displayName, account.email)} を編集`}
                            href={`/account/${account.id}/edit`}
                            tone="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            label={`${getAccountLabel(account.displayName, account.email)} を削除`}
                            tone="danger"
                            onClick={() => handleDelete(account)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
  );
}
