"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "danger";
};

type ConfirmRequest = ConfirmOptions & {
  resolve: (confirmed: boolean) => void;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }

  return confirm;
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      setRequest({ ...options, resolve });
    });
  }, []);

  const close = (confirmed: boolean) => {
    request?.resolve(confirmed);
    setRequest(null);
  };

  useEffect(() => {
    if (!request) {
      return;
    }

    cancelRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [request]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {request && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="ダイアログを閉じる"
                className="absolute inset-0 bg-black/60"
                onClick={() => close(false)}
              />
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                className="relative z-10 w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
              >
                <h2 id="confirm-dialog-title" className="text-base font-semibold text-white">
                  {request.title}
                </h2>
                <p
                  id="confirm-dialog-description"
                  className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400"
                >
                  {request.description}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <Button ref={cancelRef} variant="ghost" size="sm" onClick={() => close(false)}>
                    {request.cancelLabel ?? "キャンセル"}
                  </Button>
                  <Button
                    variant={request.tone === "danger" ? "danger" : "primary"}
                    size="sm"
                    onClick={() => close(true)}
                  >
                    {request.confirmLabel ?? "OK"}
                  </Button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </ConfirmContext.Provider>
  );
}
