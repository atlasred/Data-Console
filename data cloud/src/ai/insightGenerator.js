import { spawnSync } from 'child_process';
import { buildManagerPrompt } from './promptBuilder.js';
import { validateManagerInsights } from './schema.js';

function extractJson(rawText = '') {
  const withoutFences = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = withoutFences.indexOf('{');
  const lastBrace = withoutFences.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error('No JSON object found in Ollama output.');
  }
  return withoutFences.slice(firstBrace, lastBrace + 1);
}

function sanitizeJsonText(jsonText = '') {
  return String(jsonText)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[\u0000-\u0019]/g, '');
}



function toInsightText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value
        .map((item) => toInsightText(item).trim())
        .filter(Boolean)
        .join(', ');
    }

    const entries = Object.entries(value)
      .filter(([, entryValue]) => entryValue !== null && entryValue !== undefined)
      .map(([key, entryValue]) => {
        const formattedValue =
          typeof entryValue === 'object' ? toInsightText(entryValue) : String(entryValue).trim();

        if (!formattedValue) {
          return '';
        }

        if (key === 'text' || key === 'action') {
          return formattedValue;
        }

        return `${key}: ${formattedValue}`;
      })
      .filter(Boolean);

    if (entries.length) {
      return entries.join(', ');
    }

    try {
      return JSON.stringify(value);
    } catch {
      return '[invalid-object]';
    }
  }

  return String(value);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => toInsightText(item).trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(/\n|;|\|/g)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .map((item) => toInsightText(item).trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeChartCaptions(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  return {
    netRevenueBySegment: String(source.netRevenueBySegment ?? '').trim(),
    refundBySegment: String(source.refundBySegment ?? '').trim(),
    refundsOverTime: String(source.refundsOverTime ?? '').trim()
  };
}

function normalizeManagerInsights(payload = {}) {
  return {
    headline: toInsightText(payload.headline).trim(),
    summary: toInsightText(payload.summary).trim(),
    alerts: normalizeStringArray(payload.alerts),
    recommendedActions: normalizeStringArray(payload.recommendedActions),
    chartCaptions: normalizeChartCaptions(payload.chartCaptions)
  };
}

export function parseManagerInsightsJson(rawText = '') {
  const extracted = extractJson(rawText);

  try {
    return JSON.parse(extracted);
  } catch {
    const sanitized = sanitizeJsonText(extracted);
    return JSON.parse(sanitized);
  }
}

export async function generateManagerInsights(analysisResult = {}, options = {}) {
  const model = options.model || process.env.OLLAMA_MODEL || 'llama3.1';
  const prompt = buildManagerPrompt(analysisResult);

  const run = spawnSync('ollama', ['run', model, prompt], {
    encoding: 'utf8',
    timeout: 45000
  });

  if (run.error) {
    throw new Error(`Ollama execution failed: ${run.error.message}`);
  }

  if (run.status !== 0) {
    throw new Error(`Ollama returned non-zero status (${run.status}): ${run.stderr || run.stdout}`);
  }

  const parsed = parseManagerInsightsJson(run.stdout || '');
  const normalized = normalizeManagerInsights(parsed);
  const validation = validateManagerInsights(normalized);
  if (!validation.valid) {
    throw new Error(`Ollama JSON failed schema validation: ${validation.error}`);
  }

  return normalized;
}
