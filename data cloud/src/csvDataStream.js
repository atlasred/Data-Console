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

function isHeaderSchemaValid(actualHeaders, expectedHeaders = []) {
  if (!expectedHeaders.length) {
    return true;
  }

  if (actualHeaders.length !== expectedHeaders.length) {
    return false;
  }

  return expectedHeaders.every((header, index) => header === actualHeaders[index]);
}

async function streamCsvIntoLake(filePath, dataLake, streamConfig = {}) {
  const stream = fs.createReadStream(filePath, 'utf8');
  const lineReader = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const entityName = streamConfig.dloName || streamConfig.entityName || inferEntityName(filePath);
  const primaryKey = streamConfig.primaryKey;
  const expectedHeaders = streamConfig.expectedHeaders || [];
  const streamName = streamConfig.streamName || `${entityName}_stream`;
  let headers = null;

  for await (const line of lineReader) {
    if (!line.trim()) {
      continue;
    }

    if (!headers) {
      headers = parseCsvLine(line);
      if (!isHeaderSchemaValid(headers, expectedHeaders)) {
        throw new Error(
          `${streamName} header mismatch. Expected [${expectedHeaders.join(', ')}] but found [${headers.join(', ')}]`
        );
      }
      continue;
    }

    const values = parseCsvLine(line);
    const record = headers.reduce((acc, header, index) => {
      const raw = values[index] ?? '';
      const asNumber = Number(raw);
      acc[header] = Number.isNaN(asNumber) || raw === '' ? raw : asNumber;
      return acc;
    }, {});

    const validation = validateRecord(entityName, record);
    if (!validation.valid) {
      console.warn(`Skipped invalid record in ${entityName}: ${validation.errors.join('; ')}`);
      continue;
    }

    dataLake.upsert(entityName, record, { primaryKey });
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
    const fileName = streamConfig.fileName;
    const fullPath = path.join(csvFolderPath, fileName);

    if (!fs.existsSync(fullPath)) {
      console.warn(`Configured stream file is missing: ${fileName}`);
      continue;
    }

    await streamCsvIntoLake(fullPath, dataLake, streamConfig);
    processed.push(fileName);
  }

  return processed;
}

module.exports = {
  ingestAllCsv,
  streamCsvIntoLake,
  isHeaderSchemaValid
};
