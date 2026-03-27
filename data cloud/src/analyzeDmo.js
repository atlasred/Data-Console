const fs = require('fs');
const path = require('path');

function normalizeNumber(value) {
  const parsed = Number(value ?? 0);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function buildChartsFromSemantic(semanticView = {}) {
  const segmentSummaries = Array.isArray(semanticView.segmentSummaries) ? semanticView.segmentSummaries : [];
  const monthlyRefunds = Array.isArray(semanticView.monthlyRefunds) ? semanticView.monthlyRefunds : [];

  const netRevenueBySegment = segmentSummaries.map((segment) => ({
    segment: segment.segment,
    value: Number(normalizeNumber(segment.netRevenue).toFixed(2))
  }));

  const refundBySegment = segmentSummaries.map((segment) => ({
    segment: segment.segment,
    refundAmount: Number(normalizeNumber(segment.refundAmount).toFixed(2)),
    refundRate: Number(normalizeNumber(segment.refundRate).toFixed(2))
  }));

  const refundsOverTime = monthlyRefunds.map((month) => ({
    month: month.month,
    refundAmount: Number(normalizeNumber(month.refundAmount).toFixed(2)),
    refundsCount: Number(month.refundsCount || 0)
  }));

  const customerMixBySegment = segmentSummaries.map((segment) => ({
    segment: segment.segment,
    customers: Number(segment.customerCount || 0)
  }));

  const heatmap = segmentSummaries.map((segment) => ({
    segment: segment.segment,
    metrics: {
      netRevenue: Number(normalizeNumber(segment.netRevenue).toFixed(2)),
      refundAmount: Number(normalizeNumber(segment.refundAmount).toFixed(2)),
      refundRate: Number(normalizeNumber(segment.refundRate).toFixed(2)),
      ticketRate: Number(normalizeNumber(segment.ticketRate).toFixed(2)),
      orderCount: Number(segment.orderCount || 0)
    }
  }));

  return {
    netRevenueBySegment,
    refundBySegment,
    refundsOverTime,
    customerMixBySegment,
    heatmap
  };
}

async function analyzeDmoEntities(modeled = {}, options = {}) {
  const semanticModule = await import('./semantic/buildSemanticView.js');
  const aiModule = await import('./ai/insightGenerator.js');

  const semanticView = semanticModule.buildSemanticView(modeled || {});
  const charts = buildChartsFromSemantic(semanticView);
  const managerInsights = await aiModule.generateManagerInsights(
    {
      ...semanticView,
      comparisonFlags: {
        highRefundSegments: semanticView.segmentSummaries
          .filter((segment) => segment.flags?.highRefundPressure)
          .map((segment) => segment.segment),
        atRiskSegments: semanticView.segmentSummaries
          .filter((segment) => segment.flags?.atRisk)
          .map((segment) => segment.segment)
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
