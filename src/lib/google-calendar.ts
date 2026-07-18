export type GoogleCalendarEventInput = {
  title: string;
  startAt: string;
  endAt?: string;
  description?: string;
  defaultDurationMinutes?: number;
};

const DEFAULT_DURATION_MINUTES = 60;

function parseLocalDateTime(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatGoogleCalendarDateTime(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

export function resolveScheduledEndAt(
  startAt: string,
  endAt?: string,
  defaultDurationMinutes = DEFAULT_DURATION_MINUTES,
): string | null {
  const start = parseLocalDateTime(startAt);
  if (!start) {
    return null;
  }

  if (endAt?.trim()) {
    const end = parseLocalDateTime(endAt);
    if (end && end.getTime() > start.getTime()) {
      return endAt.trim();
    }
  }

  const fallback = new Date(start);
  fallback.setMinutes(fallback.getMinutes() + defaultDurationMinutes);
  return toDateTimeLocalValue(fallback);
}

export function toDateTimeLocalValue(date: Date): string {
  const pad = (num: number) => String(num).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join("");
}

export function buildGoogleCalendarUrl(input: GoogleCalendarEventInput): string | null {
  const start = parseLocalDateTime(input.startAt);
  if (!start) {
    return null;
  }

  const resolvedEndAt = resolveScheduledEndAt(
    input.startAt,
    input.endAt,
    input.defaultDurationMinutes,
  );
  const end = parseLocalDateTime(resolvedEndAt ?? "");
  if (!end) {
    return null;
  }

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title.trim() || "WBS 作業",
    dates: `${formatGoogleCalendarDateTime(start)}/${formatGoogleCalendarDateTime(end)}`,
  });

  if (input.description?.trim()) {
    params.set("details", input.description.trim());
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function formatScheduledDateTime(value: string | undefined): string {
  const date = parseLocalDateTime(value ?? "");
  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatScheduledRange(startAt?: string, endAt?: string): string {
  const startLabel = formatScheduledDateTime(startAt);
  if (!startLabel) {
    return "";
  }

  const endLabel = formatScheduledDateTime(endAt);
  if (endLabel) {
    return `${startLabel} 〜 ${endLabel}`;
  }

  return startLabel;
}

export function validateScheduledRange(startAt: string, endAt: string): string | null {
  if (!startAt.trim() && !endAt.trim()) {
    return null;
  }

  if (startAt.trim() && !parseLocalDateTime(startAt)) {
    return "対応予定日時の形式が正しくありません。";
  }

  if (endAt.trim() && !parseLocalDateTime(endAt)) {
    return "対応予定終了日時の形式が正しくありません。";
  }

  if (startAt.trim() && endAt.trim()) {
    const start = parseLocalDateTime(startAt);
    const end = parseLocalDateTime(endAt);
    if (start && end && end.getTime() <= start.getTime()) {
      return "対応予定終了日時は開始日時より後にしてください。";
    }
  }

  return null;
}
