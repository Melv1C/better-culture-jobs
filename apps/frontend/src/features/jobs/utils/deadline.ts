export type DeadlineStatus = 'expired' | 'urgent' | 'near' | 'soon' | 'ok' | 'unknown';

export interface DeadlineInfo {
  status: DeadlineStatus;
  /** Days remaining (negative if expired, null if unknown) */
  daysLeft: number | null;
}

/**
 * Returns urgency information for a job's application deadline.
 *
 * Status tiers:
 * - unknown  → no deadline available
 * - ok       → more than 14 days left
 * - soon     → 8–14 days left
 * - near     → 4–7 days left
 * - urgent   → 0–3 days left
 * - expired  → deadline has passed
 */
export function getDeadlineInfo(deadline: string | null | undefined): DeadlineInfo {
  if (!deadline) return { status: 'unknown', daysLeft: null };

  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return { status: 'unknown', daysLeft: null };

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const deadlineMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.round((deadlineMidnight.getTime() - todayMidnight.getTime()) / msPerDay);

  if (daysLeft < 0) return { status: 'expired', daysLeft };
  if (daysLeft <= 3) return { status: 'urgent', daysLeft };
  if (daysLeft <= 7) return { status: 'near', daysLeft };
  if (daysLeft <= 14) return { status: 'soon', daysLeft };
  return { status: 'ok', daysLeft };
}
