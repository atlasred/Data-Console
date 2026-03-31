import {
  getConversionRate,
  getCartAbandonmentRate,
  getLoginStickiness,
  getEngagementScore
} from './metrics.js';
import { isAtRiskCustomer, isHealthyCustomer, hasHighAbandonmentPressure, getClientCategory } from './rules.js';

function sum(records = [], field) {
  return records.reduce((total, record) => total + Number(record[field] || 0), 0);
}

export function buildSemanticView(entities = {}) {
  const customers = Array.isArray(entities.CustomerEngagement_DMO) ? entities.CustomerEngagement_DMO : [];

  const customerSummaries = customers.map((customer) => {
    const sessionCount = Number(customer.sessionCount || 0);
    const addToCartCount = Number(customer.addToCartCount || 0);
    const cartAbandonmentCount = Number(customer.cartAbandonmentCount || 0);
    const completedPurchaseCount = Number(customer.completedPurchaseCount || 0);
    const conversionRate = getConversionRate(completedPurchaseCount, sessionCount);
    const cartAbandonmentRate = getCartAbandonmentRate(cartAbandonmentCount, addToCartCount);
    const loginStickiness = getLoginStickiness(customer.loginEventCount, customer.logoutEventCount);
    const engagementScore = getEngagementScore(customer);

    const summary = {
      customerId: customer.customerId,
      customerName: customer.customerName || customer.customerId,
      sessionCount,
      productViewCount: Number(customer.productViewCount || 0),
      addToCartCount,
      cartAbandonmentCount,
      completedPurchaseCount,
      uniqueVisitorsOrCustomers: Number(customer.uniqueVisitorsOrCustomers || 0),
      repeatCustomerCount: Number(customer.repeatCustomerCount || 0),
      avgSessionDurationMinutes: Number(customer.avgSessionDurationMinutes || 0),
      loginEventCount: Number(customer.loginEventCount || 0),
      purchasesTotal: Number(customer.purchasesTotal || 0),
      conversionRate,
      cartAbandonmentRate,
      loginStickiness,
      engagementScore
    };

    return {
      ...summary,
      clientCategory: getClientCategory(summary),
      flags: {
        atRisk: isAtRiskCustomer(summary),
        healthy: isHealthyCustomer(summary),
        highAbandonmentPressure: hasHighAbandonmentPressure(summary)
      }
    };
  });

  const totalSessions = sum(customers, 'sessionCount');
  const totalProductViews = sum(customers, 'productViewCount');
  const totalAddToCart = sum(customers, 'addToCartCount');
  const totalCheckoutStarts = sum(customers, 'checkoutStartCount');
  const totalCompletedPurchases = sum(customers, 'completedPurchaseCount');
  const totalPurchasesValue = sum(customers, 'purchasesTotal');
  const totalLoginEvents = sum(customers, 'loginEventCount');
  const totalLogoutEvents = sum(customers, 'logoutEventCount');
  const totalCartAbandonment = sum(customers, 'cartAbandonmentCount');

  const businessKpis = {
    totalCustomers: customers.length,
    totalSessions,
    totalProductViews,
    totalAddToCart,
    totalCheckoutStarts,
    totalCompletedPurchases,
    totalPurchasesValue,
    overallConversionRate: getConversionRate(totalCompletedPurchases, totalSessions),
    overallCartAbandonmentRate: getCartAbandonmentRate(totalCartAbandonment, totalAddToCart),
    loginStickiness: getLoginStickiness(totalLoginEvents, totalLogoutEvents),
    avgSessionDurationMinutes: customers.length ? sum(customers, 'avgSessionDurationMinutes') / customers.length : 0
  };

  const funnelTotals = [
    { step: 'Sessions', value: totalSessions },
    { step: 'Product Views', value: totalProductViews },
    { step: 'Add To Cart', value: totalAddToCart },
    { step: 'Checkout Starts', value: totalCheckoutStarts },
    { step: 'Completed Purchases', value: totalCompletedPurchases }
  ];

  const rateDistribution = customerSummaries.map((item) => ({
    customerId: item.customerId,
    customerName: item.customerName,
    cartToCheckoutRate: Number(customers.find((c) => c.customerId === item.customerId)?.cartToCheckoutRate || 0),
    checkoutToPurchaseRate: Number(customers.find((c) => c.customerId === item.customerId)?.checkoutToPurchaseRate || 0)
  }));

  const tierBreakdown = customerSummaries.reduce((acc, customer) => {
    const category = customer.clientCategory || 'Uncategorized';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return {
    businessKpis,
    customerSummaries,
    funnelTotals,
    rateDistribution,
    tierBreakdown
  };
}
