function indexBy(records = [], key) {
  return new Map(records.map((record) => [String(record[key]), record]));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function buildDataModelObjects(rawEntities = {}) {
  const engagement = rawEntities.CustomerEngagement_DLO || [];
  const byCustomer = indexBy(engagement, 'customerId');

  const CustomerEngagement_DMO = engagement.map((record) => ({
    customerId: record.customerId,
    customerName: record.customerName || '',
    sessionCount: toNumber(record.sessionCount),
    uniqueVisitorsOrCustomers: toNumber(record.uniqueVisitorsOrCustomers),
    productViewCount: toNumber(record.productViewCount),
    addToCartCount: toNumber(record.addToCartCount),
    cartAbandonmentCount: toNumber(record.cartAbandonmentCount),
    abandonedCartsCount: toNumber(record.abandonedCartsCount),
    checkoutStartCount: toNumber(record.checkoutStartCount),
    completedPurchaseCount: toNumber(record.completedPurchaseCount),
    purchasesTotal: toNumber(record.purchasesTotal),
    repeatCustomerCount: toNumber(record.repeatCustomerCount),
    avgSessionDurationMinutes: toNumber(record.avgSessionDurationMinutes),
    avgLoggedInMinutes: toNumber(record.avgLoggedInMinutes),
    loginEventCount: toNumber(record.loginEventCount),
    logoutEventCount: toNumber(record.logoutEventCount),
    cartToCheckoutRate: toNumber(record.cartToCheckoutRate),
    checkoutToPurchaseRate: toNumber(record.checkoutToPurchaseRate)
  }));

  const CustomerSnapshot_DMO = CustomerEngagement_DMO.map((record) => ({
    customerId: record.customerId,
    customerName: record.customerName,
    engagementScore:
      record.sessionCount * 2 +
      record.productViewCount +
      record.addToCartCount * 3 +
      record.checkoutStartCount * 4 +
      record.completedPurchaseCount * 5,
    cartAbandonmentPressure: record.cartAbandonmentCount + record.abandonedCartsCount,
    conversionStrength: record.checkoutToPurchaseRate,
    purchasesTotal: record.purchasesTotal
  }));

  const unresolvedLinks = {
    duplicateCustomerIds: Math.max(0, engagement.length - byCustomer.size)
  };

  return {
    entities: {
      CustomerEngagement_DMO,
      CustomerSnapshot_DMO
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      unresolvedLinks
    }
  };
}

module.exports = {
  buildDataModelObjects
};
