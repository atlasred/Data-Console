/**
 * Rules consume semantic summaries only (no raw DMO rows).
 */

export function hasHighAbandonmentPressure(summary = {}) {
  return Number(summary.cartAbandonmentRate ?? 0) >= 35;
}

export function isAtRiskCustomer(summary = {}) {
  return (
    hasHighAbandonmentPressure(summary) ||
    Number(summary.conversionRate ?? 0) < 2 ||
    Number(summary.sessionCount ?? 0) === 0
  );
}

export function isHealthyCustomer(summary = {}) {
  return (
    Number(summary.conversionRate ?? 0) >= 5 &&
    Number(summary.cartAbandonmentRate ?? 0) < 20 &&
    Number(summary.engagementScore ?? 0) > 15
  );
}
