const fs = require('fs');
const path = require('path');

function normalizeNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildChartsFromSemantic(semanticView = {}) {
  const customerSummaries = Array.isArray(semanticView.customerSummaries) ? semanticView.customerSummaries : [];
  const funnelTotals = Array.isArray(semanticView.funnelTotals) ? semanticView.funnelTotals : [];
  const rateDistribution = Array.isArray(semanticView.rateDistribution) ? semanticView.rateDistribution : [];
  const tierBreakdown = semanticView.tierBreakdown || {};

  const purchasesByCustomer = customerSummaries.map((customer) => ({
    customer: customer.customerName || customer.customerId,
    value: Number(normalizeNumber(customer.purchasesTotal).toFixed(2))
  }));

  const conversionByCustomer = customerSummaries.map((customer) => ({
    customer: customer.customerName || customer.customerId,
    conversionRate: Number(normalizeNumber(customer.conversionRate).toFixed(2)),
    cartAbandonmentRate: Number(normalizeNumber(customer.cartAbandonmentRate).toFixed(2))
  }));

  const funnelStageTotals = funnelTotals.map((stage) => ({
    step: stage.step,
    value: Number(normalizeNumber(stage.value).toFixed(2))
  }));

  const engagementByCustomer = Object.entries(tierBreakdown).map(([category, count]) => ({
    category,
    customers: Number(count || 0)
  }));

  const heatmap = rateDistribution.map((customer) => ({
    segment: customer.customerName || customer.customerId,
    metrics: {
      cartToCheckoutRate: Number(normalizeNumber(customer.cartToCheckoutRate).toFixed(2)),
      checkoutToPurchaseRate: Number(normalizeNumber(customer.checkoutToPurchaseRate).toFixed(2))
    }
  }));

  return {
    purchasesByCustomer,
    conversionByCustomer,
    funnelStageTotals,
    engagementByCustomer,
    heatmap
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
