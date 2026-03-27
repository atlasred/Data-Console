# Data Governance Rules

## 1) Data quality standards
- `customerId` and all primary key columns must be non-null.
- Revenue fields (`grossRevenue`, `discountAmount`, `netRevenue`, `refundAmount`, `mrr`) must be numeric and >= 0.
- Date fields must use ISO date format (`YYYY-MM-DD`).

## 2) Privacy & PII handling
- `email` is classified as sensitive PII.
- Exports used for analytics sharing must mask email usernames (example: `j***@example.com`).

## 3) Freshness policy
- CSV exports should be updated daily.
- `lake-summary.json` is the source of truth for `lastUpdatedAt` and processed files.

## 4) Access policy
- Raw CSV exports are write-restricted.
- Data explorer output should be read-only by default.

## 5) Revenue integrity checks
- `netRevenue <= grossRevenue`
- `discountAmount <= grossRevenue`
- `refundAmount <= customer_orders.netRevenue` (for matched orders)
