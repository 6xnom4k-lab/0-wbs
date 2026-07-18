export type WbsTaskStatus = "not_started" | "in_progress" | "done" | "on_hold";

export type WbsTaskLink = {
  id: string;
  title: string;
  url: string;
};

export type WbsNode = {
  id: string;
  code: string;
  name: string;
  children: WbsNode[];
  /** 詳細情報 */
  description?: string;
  assignee?: string;
  startDate?: string;
  endDate?: string;
  /** 対応予定開始日時（datetime-local 形式） */
  scheduledAt?: string;
  /** 対応予定終了日時（datetime-local 形式） */
  scheduledEndAt?: string;
  /** Google カレンダー連携後のイベント URL */
  googleCalendarEventUrl?: string;
  status?: WbsTaskStatus;
  /** 作業工数（人日など） */
  effort?: number;
  /** 備考 */
  notes?: string;
  /** 資料・作業記録（本文） */
  content?: string;
  /** 関連資料リンク */
  links?: WbsTaskLink[];
};

export type WbsProject = {
  id: string;
  name: string;
  root: WbsNode;
  createdAt: string;
  updatedAt: string;
};

export type WbsProjectSummary = Pick<
  WbsProject,
  "id" | "name" | "createdAt" | "updatedAt"
> & {
  nodeCount: number;
};
