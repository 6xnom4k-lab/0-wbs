/** 更新日時などを日本語の相対表現で表示 */
export function formatRelativeDateJa(value: string): string {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return "たった今";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}分前`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}時間前`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}日前`;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}
