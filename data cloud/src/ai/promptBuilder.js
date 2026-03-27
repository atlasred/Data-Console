export function buildManagerPrompt(analysisResult = {}) {
  const instructions = [
    'Return ONLY valid JSON with keys: headline, summary, alerts, recommendedActions, chartCaptions.',
    'Use only provided facts. Do not invent numbers.',
    'Summary must be concise and business-manager friendly, max 2 short paragraphs.',
    'Mention top opportunity and top risk.',
    'Alerts must be action-relevant.',
    'Recommended actions must be specific.',
    'Do not include markdown fences, comments, or trailing commas.',
  ].join('\n');

  const input = JSON.stringify(analysisResult, null, 2);
  return `${instructions}\n\nFacts:\n${input}`;
}
