import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputClassName =
  "w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-zinc-600";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export function Input({ className = "", hasError = false, ...props }: InputProps) {
  return (
    <input
      className={`${inputClassName} ${hasError ? "border-red-500/70 focus:border-red-500" : ""} ${className}`}
      {...props}
    />
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export function Textarea({ className = "", hasError = false, ...props }: TextareaProps) {
  return (
    <textarea
      className={`${inputClassName} ${hasError ? "border-red-500/70 focus:border-red-500" : ""} ${className}`}
      {...props}
    />
  );
}
