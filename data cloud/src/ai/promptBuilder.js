export function buildManagerPrompt(analysisResult = {}) {
  const instructions = [
    'Return ONLY valid JSON with keys: headline, summary, alerts, recommendedActions, chartCaptions.',
    'Use only provided facts. Do not invent numbers.',
    'Summary must be concise, customer-focused, and business-manager friendly (max 3 short sentences).',
    'Mention top-performing customer behavior, top risk pattern, and funnel bottleneck.',
    'Alerts must be action-relevant and refer to customer cohorts or named customers when possible.',
    'Recommended actions must be specific and tied to conversion, abandonment, or retention.',
    'Do not include markdown fences, comments, or trailing commas.',
  ].join('\n');

  const input = JSON.stringify(analysisResult, null, 2);
  return `${instructions}\n\nFacts:\n${input}`;
}
