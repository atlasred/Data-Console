# Data Cloud

This folder contains a standalone stream-ingestion layer, raw Data Lake Objects (DLOs), and runtime-generated Data Model Objects (DMOs).

## Data Streams (CSV -> Stream)
- `customer_engagement_stream` -> `customers*.csv` (supports both tabular customer metrics headers and `metric,value` admin exports)

## Raw DLO outputs
- `CustomerEngagement_DLO`

## What the pipeline does
- Reads CSV files from `csv-exports/`.
- Validates file schema (CSV headers) against expected stream schema or accepted admin metric/value format.
- Validates row-level governance rules from `src/dataGovernance.js`.
- Upserts rows into DLO collections through `src/dataObjectsLake.js`.
- Builds customer categories (e.g., `VIP`, `Loyal`, `Active`, `New`, `At Risk`) for AI summary and dashboard views.
- Writes runtime-generated artifacts:
  - `data/objects-lake.json`
  - `data/model-objects.json`
  - `data/dmo-analytics.json`
  - `data/lake-summary.json`

> Note: files in `data/` are generated at ingestion time and are not source-controlled.

## Run from CLI
```bash
cd "data console/data cloud"
npm install
npm run ingest
```

## Watch mode (file-change triggered)
```bash
cd "data console/data cloud"
npm run ingest:watch
```

## Scheduled mode
```bash
cd "data console/data cloud"
npm run ingest:schedule
```

## Run ingest from dashboard button
```bash
cd "data console"
npm run serve
```
Then use `POST /api/ingest` from the dashboard **Run Ingest** button.

## References
- Streams + DLO mapping: `csvs_info.md`
- Business model: `data-model.md` (materialized into `data/model-objects.json` during ingestion)
- Governance: `data-governance.md`


## DMO analytics script
- Script: `src/analyzeDmo.js`
- It analyzes `data/model-objects.json` and writes chart-ready metrics to `data/dmo-analytics.json` during each ingestion run.


## Semantic layer
- Folder: `src/semantic/`
- Files: `metrics.js`, `dimensions.js`, `rules.js`, `buildSemanticView.js`
- Purpose: reusable business-meaning summaries between DMO objects and analytics.

## AI summary layer
- Folder: `src/ai/`
- Files: `promptBuilder.js`, `insightGenerator.js`, `schema.js`
- Purpose: manager-friendly JSON insights from semantic/analysis outputs (never raw DMO rows).
