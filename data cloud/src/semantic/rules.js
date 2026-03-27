/**
 * Rules consume semantic summaries only (no raw DMO rows).
 */

export function hasHighRefundPressure(summary = {}) {
  return Number(summary.refundRate ?? 0) >= 12;
}

export function isAtRiskSegment(summary = {}) {
  return hasHighRefundPressure(summary) || Number(summary.ticketRate ?? 0) >= 1.1;
}

export function isHealthySegment(summary = {}) {
  return Number(summary.netRevenue ?? 0) > 0 && Number(summary.refundRate ?? 0) < 8 && Number(summary.ticketRate ?? 0) < 0.8;
}
