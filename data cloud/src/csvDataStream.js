const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { validateRecord } = require('./dataGovernance');

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const isEscapedQuote = line[i + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function inferEntityName(filePath) {
  return path.basename(filePath, path.extname(filePath)).toLowerCase();
}

function normalizeHeaderName(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeRecordValue(raw) {
  if (raw == null) {
    return '';
  }

  const trimmed = String(raw).trim();
  if (trimmed === '') {
    return '';
  }

  const asNumber = Number(trimmed);
  return Number.isNaN(asNumber) ? trimmed : asNumber;
}

function remapHeaders(headers, headerMap = {}) {
  return headers.map((header) => headerMap[header] || header);
}

function isHeaderSchemaValid(actualHeaders, expectedHeaders = [], acceptedHeaderSets = []) {
  const normalizedActual = actualHeaders.map(normalizeHeaderName);
  const expectedSets = [];

  if (!expectedHeaders.length) {
    expectedSets.push([]);
  } else {
    expectedSets.push(expectedHeaders);
  }

  if (Array.isArray(acceptedHeaderSets)) {
    acceptedHeaderSets.forEach((headerSet) => {
      if (Array.isArray(headerSet) && headerSet.length > 0) {
        expectedSets.push(headerSet);
      }
    });
  }

  if (!expectedSets.length || (expectedSets.length === 1 && expectedSets[0].length === 0)) {
    return true;
  }

  return expectedSets.some((expectedSet) => {
    if (normalizedActual.length !== expectedSet.length) {
      return false;
    }

    return expectedSet.every((header, index) => normalizeHeaderName(header) === normalizedActual[index]);
  });
}

async function streamCsvIntoLake(filePath, dataLake, streamConfig = {}) {
  const stream = fs.createReadStream(filePath, 'utf8');
  const lineReader = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const entityName = streamConfig.dloName || streamConfig.entityName || inferEntityName(filePath);
  const primaryKey = streamConfig.primaryKey;
  const expectedHeaders = streamConfig.expectedHeaders || [];
  const acceptedHeaderSets = streamConfig.acceptedHeaderSets || [];
  const headerMap = streamConfig.headerMap || {};
  const streamName = streamConfig.streamName || `${entityName}_stream`;
  const format = streamConfig.format || 'table';
  const metricColumn = streamConfig.metricColumn || 'metric';
  const valueColumn = streamConfig.valueColumn || 'value';
  const metricMap = streamConfig.metricMap || {};
  let headers = null;
  let effectiveFormat = format;
  const keyValueRecord = {};

  for await (const line of lineReader) {
    if (!line.trim()) {
      continue;
    }

    if (!headers) {
      const parsedHeaders = parseCsvLine(line);
      headers = remapHeaders(parsedHeaders, headerMap);
      const hasMetricValueHeaders =
        headers.includes(metricColumn) && headers.includes(valueColumn);
      effectiveFormat = format === 'auto' ? (hasMetricValueHeaders ? 'metricValue' : 'table') : format;

      if (!isHeaderSchemaValid(headers, expectedHeaders, acceptedHeaderSets)) {
        throw new Error(
          `${streamName} header mismatch. Expected [${expectedHeaders.join(', ')}] but found [${headers.join(', ')}]`
        );
      }
      continue;
    }

    const values = parseCsvLine(line);

    if (effectiveFormat === 'metricValue') {
      const metricIndex = headers.indexOf(metricColumn);
      const valueIndex = headers.indexOf(valueColumn);
      const metricName = values[metricIndex];
      if (!metricName) {
        continue;
      }

      const normalizedMetricName = metricMap[metricName] || metricName;
      keyValueRecord[normalizedMetricName] = normalizeRecordValue(values[valueIndex]);
      continue;
    }

    const record = headers.reduce((acc, header, index) => {
      acc[header] = normalizeRecordValue(values[index] ?? '');
      return acc;
    }, {});

    const validation = validateRecord(entityName, record);
    if (!validation.valid) {
      console.warn(`Skipped invalid record in ${entityName}: ${validation.errors.join('; ')}`);
      continue;
    }

    dataLake.upsert(entityName, record, { primaryKey });
  }

  if (effectiveFormat === 'metricValue' && Object.keys(keyValueRecord).length > 0) {
    const validation = validateRecord(entityName, keyValueRecord);
    if (!validation.valid) {
      console.warn(`Skipped invalid record in ${entityName}: ${validation.errors.join('; ')}`);
    } else {
      dataLake.upsert(entityName, keyValueRecord, { primaryKey });
    }
  }

  dataLake.markIngestion(path.basename(filePath), streamName, entityName);
}

async function ingestAllCsv(csvFolderPath, dataLake, streamDefinitions = []) {
  const discoveredFileNames = fs
    .readdirSync(csvFolderPath)
    .filter((name) => name.toLowerCase().endsWith('.csv'))
    .sort();

  const hasConfiguredStreams = Array.isArray(streamDefinitions) && streamDefinitions.length > 0;

  if (!hasConfiguredStreams) {
    for (const name of discoveredFileNames) {
      const fullPath = path.join(csvFolderPath, name);
      await streamCsvIntoLake(fullPath, dataLake);
    }
    return discoveredFileNames;
  }

  const processed = [];
  for (const streamConfig of streamDefinitions) {
    const matchedFileNames = [];

    if (streamConfig.filePattern) {
      const matcher = streamConfig.filePattern instanceof RegExp
        ? streamConfig.filePattern
        : new RegExp(String(streamConfig.filePattern), 'i');
      discoveredFileNames.forEach((name) => {
        if (matcher.test(name)) {
          matchedFileNames.push(name);
        }
      });
    } else if (streamConfig.fileName) {
      matchedFileNames.push(streamConfig.fileName);
    }

    if (!matchedFileNames.length) {
      const label = streamConfig.fileName || String(streamConfig.filePattern || streamConfig.streamName || 'unknown');
      console.warn(`Configured stream file is missing: ${label}`);
      continue;
    }

    for (const fileName of matchedFileNames) {
      const fullPath = path.join(csvFolderPath, fileName);
      if (!fs.existsSync(fullPath)) {
        console.warn(`Configured stream file is missing: ${fileName}`);
        continue;
      }

      await streamCsvIntoLake(fullPath, dataLake, streamConfig);
      processed.push(fileName);
    }
  }

  return processed;
}

module.exports = {
  ingestAllCsv,
  streamCsvIntoLake,
  isHeaderSchemaValid
};
