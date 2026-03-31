export function buildManagerPrompt(analysisResult = {}) {
  const instructions = [
    'Return ONLY valid JSON with keys: headline, summary, alerts, recommendedActions, chartCaptions.',
    'Use only provided facts. Do not invent numbers.',
    'Summary must be concise, customer-focused, and business-manager friendly (max 4 short sentences).',
    'Must include: 1) Problems, 2) Strengths, 3) Recommended Actions, 4) Anomalies.',
    'Explicitly comment on whether engagement likely leads to revenue and whether logged-in users appear more likely to buy.',
    'Alerts must be action-relevant and refer to customer cohorts or named customers when possible.',
    'Recommended actions must be specific and tied to conversion, abandonment, loyalty, or login-to-purchase uplift.',
    'Do not include markdown fences, comments, or trailing commas.',
  ].join('\n');

  const input = JSON.stringify(analysisResult, null, 2);
  return `${instructions}\n\nFacts:\n${input}`;
}
