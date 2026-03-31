export const managerInsightSchema = {
  type: 'object',
  required: ['headline', 'summary', 'alerts', 'recommendedActions', 'chartCaptions'],
  chartCaptionKeys: ['purchasesByCustomer', 'conversionByCustomer', 'funnelStageTotals']
};

export function validateManagerInsights(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object.' };
  }

  const { headline, summary, alerts, recommendedActions, chartCaptions } = payload;

  if (typeof headline !== 'string' || typeof summary !== 'string') {
    return { valid: false, error: 'headline and summary must be strings.' };
  }

  if (!Array.isArray(alerts) || !alerts.every((entry) => typeof entry === 'string')) {
    return { valid: false, error: 'alerts must be a string array.' };
  }

  if (!Array.isArray(recommendedActions) || !recommendedActions.every((entry) => typeof entry === 'string')) {
    return { valid: false, error: 'recommendedActions must be a string array.' };
  }

  if (!chartCaptions || typeof chartCaptions !== 'object') {
    return { valid: false, error: 'chartCaptions must be an object.' };
  }

  for (const key of managerInsightSchema.chartCaptionKeys) {
    if (typeof chartCaptions[key] !== 'string') {
      return { valid: false, error: `chartCaptions.${key} must be a string.` };
    }
  }

  return { valid: true };
}
