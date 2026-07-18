"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import {
  applyWbsProposals,
  getProposalTargetLabel,
  getStatusLabel,
} from "@/lib/meeting-notes/apply-proposals";
import { buildWbsContextFromRoot } from "@/lib/meeting-notes/build-prompt";
import { findNode } from "@/lib/wbs";
import { getWbsStatusLabel } from "@/lib/wbs-task-meta";
import type {
  MeetingNotesAnalyzeResponse,
  ProposalSelection,
  WbsTaskProposal,
} from "@/types/meeting-notes";
import type { WbsNode, WbsProject } from "@/types/wbs";

type MeetingNotesImportDialogProps = {
  project: WbsProject;
  onClose: () => void;
  onApply: (root: WbsNode, result: { appliedCount: number; skippedCount: number }) => void;
};

type Step = "input" | "review" | "done";

const inputClassName =
  "w-full rounded-md border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-200 outline-none transition focus:border-zinc-600";

function proposalsToSelection(proposals: WbsTaskProposal[]): ProposalSelection[] {
  return proposals.map((proposal) => ({
    ...proposal,
    selected: proposal.confidence !== "low",
  }));
}

function ProposalDiff({
  root,
  proposal,
}: {
  root: WbsNode;
  proposal: WbsTaskProposal;
}) {
  if (proposal.action !== "update" || !proposal.targetNodeId) {
    return null;
  }

  const existing = findNode(root, proposal.targetNodeId);
  if (!existing) {
    return null;
  }

  const rows: Array<{ label: string; before: string; after: string }> = [];

  if (proposal.name && proposal.name !== existing.name) {
    rows.push({ label: "名称", before: existing.name, after: proposal.name });
  }

  if (proposal.status && proposal.status !== existing.status) {
    rows.push({
      label: "状態",
      before: getWbsStatusLabel(existing.status),
      after: getStatusLabel(proposal.status),
    });
  }

  if (proposal.startDate && proposal.startDate !== existing.startDate) {
    rows.push({
      label: "開始",
      before: existing.startDate ?? "未設定",
      after: proposal.startDate,
    });
  }

  if (proposal.endDate && proposal.endDate !== existing.endDate) {
    rows.push({
      label: "終了",
      before: existing.endDate ?? "未設定",
      after: proposal.endDate,
    });
  }

  if (proposal.assignee && proposal.assignee !== existing.assignee) {
    rows.push({
      label: "担当",
      before: existing.assignee ?? "未設定",
      after: proposal.assignee,
    });
  }

  if (rows.length === 0) {
    return <p className="text-xs text-zinc-500">メタデータの変更はありません（名称・備考のみ更新）。</p>;
  }

  return (
    <div className="mt-2 space-y-1 rounded-md border border-zinc-800 bg-black/40 p-2 text-xs">
      {rows.map((row) => (
        <p key={row.label} className="text-zinc-400">
          <span className="text-zinc-500">{row.label}: </span>
          <span className="line-through">{row.before}</span>
          <span className="mx-1 text-zinc-600">→</span>
          <span className="text-zinc-200">{row.after}</span>
        </p>
      ))}
    </div>
  );
}

export function MeetingNotesImportDialog({
  project,
  onClose,
  onApply,
}: MeetingNotesImportDialogProps) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("input");
  const [notesText, setNotesText] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [summary, setSummary] = useState("");
  const [selections, setSelections] = useState<ProposalSelection[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && step !== "done") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, step]);

  const selectedCount = useMemo(
    () => selections.filter((item) => item.selected).length,
    [selections],
  );

  const handleAnalyze = async () => {
    if (!notesText.trim()) {
      setError("議事録テキストを入力してください。");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/meeting-notes/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notesText,
          meetingTitle: meetingTitle.trim() || undefined,
          meetingDate: meetingDate.trim() || undefined,
          wbsContext: buildWbsContextFromRoot(project.root),
        }),
      });

      const data = (await response.json()) as MeetingNotesAnalyzeResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "AI 解析に失敗しました。");
      }

      setSummary(data.summary);
      setSelections(proposalsToSelection(data.proposals));
      setStep("review");
    } catch (analyzeError) {
      setError(
        analyzeError instanceof Error ? analyzeError.message : "AI 解析に失敗しました。",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelections((current) =>
      current.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item)),
    );
  };

  const setAllSelected = (selected: boolean) => {
    setSelections((current) => current.map((item) => ({ ...item, selected })));
  };

  const handleApply = useCallback(() => {
    const approved = selections.filter((item) => item.selected);

    if (approved.length === 0) {
      setError("反映する提案を1件以上選択してください。");
      return;
    }

    setIsApplying(true);
    setError(null);

    const result = applyWbsProposals(project.root, approved);
    onApply(result.root, {
      appliedCount: result.appliedCount,
      skippedCount: result.skipped.length,
    });

    setResultMessage(
      `${result.appliedCount} 件を WBS に反映しました。${
        result.skipped.length > 0 ? `（${result.skipped.length} 件スキップ）` : ""
      }`,
    );
    setStep("done");
    setIsApplying(false);
  }, [onApply, project.root, selections]);

  if (!mounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="meeting-notes-dialog-title"
        className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 id="meeting-notes-dialog-title" className="text-lg font-semibold text-white">
              議事録から AI 提案
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Notion 議事録を貼り付けて、WBS への追加・更新を提案します。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900 hover:text-zinc-200"
          >
            閉じる
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === "input" && (
            <div className="space-y-4">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-zinc-300">議事録テキスト</span>
                <textarea
                  value={notesText}
                  onChange={(event) => setNotesText(event.target.value)}
                  rows={12}
                  placeholder="Notion からコピーした議事録を貼り付け..."
                  className={`${inputClassName} resize-y font-mono text-xs leading-6`}
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-zinc-300">会議名（任意）</span>
                  <input
                    value={meetingTitle}
                    onChange={(event) => setMeetingTitle(event.target.value)}
                    placeholder="例: 定例ミーティング"
                    className={inputClassName}
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-zinc-300">会議日（任意）</span>
                  <input
                    value={meetingDate}
                    onChange={(event) => setMeetingDate(event.target.value)}
                    placeholder="例: 2026-07-18"
                    className={inputClassName}
                  />
                </label>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800 bg-black/40 px-4 py-3">
                <p className="text-sm text-zinc-300">{summary}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {selections.length} 件の提案（{selectedCount} 件選択中）
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAllSelected(true)}
                  className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900"
                >
                  全選択
                </button>
                <button
                  type="button"
                  onClick={() => setAllSelected(false)}
                  className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900"
                >
                  全解除
                </button>
                <button
                  type="button"
                  onClick={() => setStep("input")}
                  className="rounded-md border border-zinc-800 px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-900"
                >
                  入力に戻る
                </button>
              </div>

              <div className="space-y-3">
                {selections.map((proposal) => (
                  <label
                    key={proposal.id}
                    className={`block cursor-pointer rounded-lg border p-4 transition ${
                      proposal.selected
                        ? "border-sky-800/60 bg-sky-950/20"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={proposal.selected}
                        onChange={() => toggleSelection(proposal.id)}
                        className="mt-1"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              proposal.action === "create"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {proposal.action === "create" ? "新規" : "更新"}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] ${
                              proposal.confidence === "high"
                                ? "bg-zinc-700 text-zinc-200"
                                : proposal.confidence === "medium"
                                  ? "bg-zinc-800 text-zinc-400"
                                  : "bg-zinc-900 text-zinc-500"
                            }`}
                          >
                            確度: {proposal.confidence}
                          </span>
                          <span className="text-sm font-medium text-white">{proposal.name}</span>
                        </div>

                        <p className="mt-1 text-xs text-zinc-500">
                          反映先: {getProposalTargetLabel(project.root, proposal)}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                          {proposal.status && (
                            <span>状態: {getStatusLabel(proposal.status)}</span>
                          )}
                          {proposal.startDate && <span>開始: {proposal.startDate}</span>}
                          {proposal.endDate && <span>終了: {proposal.endDate}</span>}
                          {proposal.assignee && <span>担当: {proposal.assignee}</span>}
                        </div>

                        {proposal.description && (
                          <p className="mt-2 text-xs text-zinc-400">{proposal.description}</p>
                        )}

                        <p className="mt-2 text-xs text-zinc-500">{proposal.reasoning}</p>

                        <ProposalDiff root={project.root} proposal={proposal} />
                      </div>
                    </div>
                  </label>
                ))}

                {selections.length === 0 && (
                  <p className="text-sm text-zinc-500">
                    提案は見つかりませんでした。議事録の内容を見直してください。
                  </p>
                )}
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 px-4 py-6 text-center">
              <p className="text-sm text-emerald-200">{resultMessage}</p>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-zinc-800 px-5 py-4">
          {step === "input" && (
            <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={isAnalyzing || !notesText.trim()}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isAnalyzing ? "解析中..." : "AI で解析"}
            </button>
          )}

          {step === "review" && (
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying || selectedCount === 0}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
            >
              {isApplying ? "反映中..." : `選択を承認して WBS に反映（${selectedCount}）`}
            </button>
          )}

          {step === "done" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
            >
              完了
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  );
}
