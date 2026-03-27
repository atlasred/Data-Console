# Data Cloud

This folder contains a standalone stream-ingestion layer, raw Data Lake Objects (DLOs), and runtime-generated Data Model Objects (DMOs).

## Data Streams (CSV -> Stream)
- `customer_profiles_stream` -> `customer_profiles.csv`
- `customer_orders_stream` -> `customer_orders.csv`
- `customer_returns_stream` -> `customer_returns.csv`
- `customer_subscriptions_stream` -> `customer_subscriptions.csv`
- `customer_support_tickets_stream` -> `customer_support_tickets.csv`

## Raw DLO outputs
- `CustomerProfile_DLO`
- `CustomerOrder_DLO`
- `CustomerReturn_DLO`
- `CustomerSubscription_DLO`
- `CustomerSupportTicket_DLO`

## What the pipeline does
- Reads CSV files from `csv-exports/`.
- Validates file schema (CSV headers) against expected stream schema.
- Validates row-level governance rules from `src/dataGovernance.js`.
- Upserts rows into DLO collections through `src/dataObjectsLake.js`.
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
