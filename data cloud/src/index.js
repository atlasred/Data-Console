const fs = require('fs');
const path = require('path');
const DataObjectsLake = require('./dataObjectsLake');
const { ingestAllCsv } = require('./csvDataStream');
const { STREAM_DEFINITIONS } = require('./dataStreams');
const { buildDataModelObjects } = require('./dataModelObjects');
const { writeDmoAnalytics } = require('./analyzeDmo');

const ROOT = path.resolve(__dirname, '..');
const CSV_EXPORTS = path.join(ROOT, 'csv-exports');
const OBJECTS_LAKE_FILE = path.join(ROOT, 'data', 'objects-lake.json');
const MODELED_OBJECTS_FILE = path.join(ROOT, 'data', 'model-objects.json');
const DMO_ANALYTICS_FILE = path.join(ROOT, 'data', 'dmo-analytics.json');
const SUMMARY_FILE = path.join(ROOT, 'data', 'lake-summary.json');

function writeModeledObjects(rawEntities) {
  const modeled = buildDataModelObjects(rawEntities);
  fs.mkdirSync(path.dirname(MODELED_OBJECTS_FILE), { recursive: true });
  fs.writeFileSync(MODELED_OBJECTS_FILE, JSON.stringify(modeled, null, 2));

  const modelObjectCounts = Object.fromEntries(
    Object.entries(modeled.entities).map(([entity, records]) => [entity, records.length])
  );

  return {
    modelObjectCounts,
    modelMetadata: modeled.metadata
  };
}

async function runIngestion() {
  const lake = new DataObjectsLake(OBJECTS_LAKE_FILE);
  lake.load();
  lake.resetForFullRebuild();

  if (!fs.existsSync(CSV_EXPORTS)) {
    fs.mkdirSync(CSV_EXPORTS, { recursive: true });
  }

  const files = await ingestAllCsv(CSV_EXPORTS, lake, STREAM_DEFINITIONS);
  lake.persist();

  const modelSummary = writeModeledObjects(lake.state.entities);
  const dmoAnalytics = await writeDmoAnalytics(MODELED_OBJECTS_FILE, DMO_ANALYTICS_FILE);

  const summary = {
    processedCsvFiles: files,
    streamDefinitions: STREAM_DEFINITIONS.map(({ streamName, fileName, dloName, primaryKey }) => ({
      streamName,
      fileName,
      dloName,
      primaryKey
    })),
    ...lake.getSummary(),
    ...modelSummary,
    dmoAnalyticsGeneratedAt: dmoAnalytics.generatedAt
  };

  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));

  console.log('Ingestion complete.');
  console.log(`Processed files: ${files.length}`);
  console.log(`Summary saved to: ${SUMMARY_FILE}`);
}

function runWatchMode() {
  console.log(`Watching CSV exports in: ${CSV_EXPORTS}`);
  runIngestion().catch((error) => {
    console.error('Initial ingestion failed:', error);
  });

  fs.watch(CSV_EXPORTS, { persistent: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith('.csv')) {
      return;
    }

    console.log(`[${new Date().toISOString()}] ${eventType} detected for ${filename}`);
    runIngestion().catch((error) => {
      console.error('Ingestion failed after change event:', error);
    });
  });
}

function getScheduleSeconds() {
  const arg = process.argv.find((value) => value.startsWith('--schedule-seconds='));
  if (!arg) {
    return null;
  }

  const raw = Number(arg.split('=')[1]);
  if (Number.isNaN(raw) || raw <= 0) {
    throw new Error('Invalid --schedule-seconds value. It must be a positive number.');
  }

  return raw;
}

function runScheduledMode(scheduleSeconds) {
  console.log(`Running scheduled ingestion every ${scheduleSeconds} seconds.`);
  runIngestion().catch((error) => {
    console.error('Initial scheduled ingestion failed:', error);
  });

  setInterval(() => {
    runIngestion().catch((error) => {
      console.error('Scheduled ingestion failed:', error);
    });
  }, scheduleSeconds * 1000);
}

const scheduleSeconds = getScheduleSeconds();

if (process.argv.includes('--watch')) {
  runWatchMode();
} else if (scheduleSeconds) {
  runScheduledMode(scheduleSeconds);
} else {
  runIngestion().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
