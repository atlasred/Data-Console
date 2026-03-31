const fs = require('fs');
const path = require('path');

function normalizeNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildChartsFromSemantic(semanticView = {}) {
  const customerSummaries = Array.isArray(semanticView.customerSummaries) ? semanticView.customerSummaries : [];
  const funnelEfficiency = customerSummaries.map((customer) => {
    const completedPurchaseCount = normalizeNumber(customer.completedPurchaseCount);
    const productViewCount = normalizeNumber(customer.productViewCount);
    return {
      customer: customer.customerName || customer.customerId,
      conversionRate: productViewCount > 0 ? Number(((completedPurchaseCount / productViewCount) * 100).toFixed(2)) : 0
    };
  });

  const engagementVsConversion = customerSummaries.map((customer) => ({
    customer: customer.customerName || customer.customerId,
    avgSessionDurationMinutes: Number(normalizeNumber(customer.avgSessionDurationMinutes).toFixed(2)),
    completedPurchaseCount: Number(normalizeNumber(customer.completedPurchaseCount).toFixed(2))
  }));

  const cartDropRate = customerSummaries.map((customer) => {
    const cartAbandonmentCount = normalizeNumber(customer.cartAbandonmentCount);
    const addToCartCount = normalizeNumber(customer.addToCartCount);
    return {
      customer: customer.customerName || customer.customerId,
      cartAbandonmentRate: addToCartCount > 0 ? Number(((cartAbandonmentCount / addToCartCount) * 100).toFixed(2)) : 0
    };
  });

  const customerLoyalty = customerSummaries.map((customer) => {
    const repeatCustomerCount = normalizeNumber(customer.repeatCustomerCount);
    const uniqueVisitorsOrCustomers = normalizeNumber(customer.uniqueVisitorsOrCustomers);
    return {
      customer: customer.customerName || customer.customerId,
      repeatRate: uniqueVisitorsOrCustomers > 0 ? Number(((repeatCustomerCount / uniqueVisitorsOrCustomers) * 100).toFixed(2)) : 0
    };
  });

  const loginImpact = customerSummaries.map((customer) => ({
    customer: customer.customerName || customer.customerId,
    loginEventCount: Number(normalizeNumber(customer.loginEventCount).toFixed(2)),
    purchasesTotal: Number(normalizeNumber(customer.purchasesTotal).toFixed(2))
  }));

  return {
    funnelEfficiency,
    engagementVsConversion,
    cartDropRate,
    customerLoyalty,
    loginImpact
  };
}

async function analyzeDmoEntities(modeled = {}, options = {}) {
  const semanticModule = await import('./semantic/buildSemanticView.js');
  const aiModule = await import('./ai/insightGenerator.js');

  const semanticView = semanticModule.buildSemanticView(modeled || {});
  const charts = buildChartsFromSemantic(semanticView);
  const customerSummaries = Array.isArray(semanticView.customerSummaries) ? semanticView.customerSummaries : [];
  const managerInsights = await aiModule.generateManagerInsights(
    {
      ...semanticView,
      comparisonFlags: {
        highAbandonmentCustomers: customerSummaries
          .filter((customer) => customer.flags?.highAbandonmentPressure)
          .map((customer) => customer.customerName || customer.customerId),
        atRiskCustomers: customerSummaries
          .filter((customer) => customer.flags?.atRisk)
          .map((customer) => customer.customerName || customer.customerId)
      }
    },
    options.ai || {}
  );

  return {
    generatedAt: new Date().toISOString(),
    semanticView,
    charts,
    managerInsights
  };
}

async function writeDmoAnalytics(modeledFilePath, outputFilePath, options = {}) {
  const modelRaw = fs.readFileSync(modeledFilePath, 'utf8');
  const parsed = JSON.parse(modelRaw);
  const analytics = await analyzeDmoEntities(parsed.entities || {}, options);

  fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
  fs.writeFileSync(outputFilePath, JSON.stringify(analytics, null, 2));
  return analytics;
}

module.exports = {
  analyzeDmoEntities,
  writeDmoAnalytics
};
