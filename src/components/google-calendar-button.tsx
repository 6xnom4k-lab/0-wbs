"use client";

import { ExternalLinkIcon } from "@/components/icons";
import { buildGoogleCalendarUrl, type GoogleCalendarEventInput } from "@/lib/google-calendar";

type GoogleCalendarButtonProps = GoogleCalendarEventInput & {
  className?: string;
  label?: string;
};

export function GoogleCalendarButton({
  title,
  startAt,
  endAt,
  description,
  defaultDurationMinutes,
  className = "",
  label = "Googleカレンダーに追加",
}: GoogleCalendarButtonProps) {
  const url = buildGoogleCalendarUrl({
    title,
    startAt,
    endAt,
    description,
    defaultDurationMinutes,
  });

  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800 ${className}`}
    >
      <ExternalLinkIcon className="h-4 w-4 shrink-0" />
      {label}
    </a>
  );
}
