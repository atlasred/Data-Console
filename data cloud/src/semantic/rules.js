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

export function getClientCategory(summary = {}) {
  const purchasesTotal = Number(summary.purchasesTotal ?? 0);
  const conversionRate = Number(summary.conversionRate ?? 0);
  const engagementScore = Number(summary.engagementScore ?? 0);
  const abandonmentRate = Number(summary.cartAbandonmentRate ?? 0);
  const sessionCount = Number(summary.sessionCount ?? 0);

  if (purchasesTotal >= 1000 && conversionRate >= 8 && abandonmentRate < 20) {
    return 'VIP';
  }

  if (isAtRiskCustomer(summary)) {
    return 'At Risk';
  }

  if (sessionCount <= 2 || engagementScore < 10) {
    return 'New';
  }

  if (isHealthyCustomer(summary)) {
    return 'Loyal';
  }

  return 'Active';
}
