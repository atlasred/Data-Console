function safeNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function getConversionRate(completedPurchaseCount = 0, sessionCount = 0) {
  const purchases = safeNumber(completedPurchaseCount);
  const sessions = safeNumber(sessionCount);
  if (sessions <= 0) {
    return 0;
  }
  return (purchases / sessions) * 100;
}

export function getCartAbandonmentRate(cartAbandonmentCount = 0, addToCartCount = 0) {
  const abandoned = safeNumber(cartAbandonmentCount);
  const added = safeNumber(addToCartCount);
  if (added <= 0) {
    return 0;
  }
  return (abandoned / added) * 100;
}

export function getLoginStickiness(loginEventCount = 0, logoutEventCount = 0) {
  const logins = safeNumber(loginEventCount);
  const logouts = safeNumber(logoutEventCount);
  if (logins <= 0) {
    return 0;
  }
  return (Math.max(logins - logouts, 0) / logins) * 100;
}

export function getEngagementScore(customer = {}) {
  return (
    safeNumber(customer.sessionCount) * 2 +
    safeNumber(customer.productViewCount) +
    safeNumber(customer.addToCartCount) * 3 +
    safeNumber(customer.checkoutStartCount) * 4 +
    safeNumber(customer.completedPurchaseCount) * 5
  );
}
