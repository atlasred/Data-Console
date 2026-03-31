# CSV Streams and Data Lake Objects Info

This file maps customer engagement CSV streams to ingestion streams and raw Data Lake Objects (DLO).

## 1) Data Streams

| Stream Name | CSV Source | Purpose |
| --- | --- | --- |
| `customer_engagement_stream` | `customers*.csv` | Customer engagement and funnel analytics from admin exports. |

### Supported schemas

#### Tabular CSV format
Expected headers:

- `customerId`
- `customerName`
- `sessionCount`
- `uniqueVisitorsOrCustomers`
- `productViewCount`
- `addToCartCount`
- `cartAbandonmentCount`
- `abandonedCartsCount`
- `checkoutStartCount`
- `completedPurchaseCount`
- `purchasesTotal`
- `repeatCustomerCount`
- `avgSessionDurationMinutes`
- `avgLoggedInMinutes`
- `loginEventCount`
- `logoutEventCount`
- `cartToCheckoutRate`
- `checkoutToPurchaseRate`

#### Metric/value CSV format
Accepted headers:

- `metric`
- `value`

Each row is mapped into a customer engagement field and aggregated into one record per file.

## 2) Data Lake Objects (Raw Layer)

| DLO | Primary Key | Source Stream |
| --- | --- | --- |
| `CustomerEngagement_DLO` | `customerId` | `customer_engagement_stream` |
