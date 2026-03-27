# CSV Streams and Data Lake Objects Info

This file maps each CSV stream to its ingestion stream name and raw Data Lake Object (DLO).

## 1) Data Streams

Each CSV is one ingestion stream that does the following:
- reads the CSV,
- validates CSV schema (header shape),
- validates row data,
- ingests rows on run/watch/scheduled jobs,
- writes raw rows into DLO objects.

| Stream Name | CSV Source | Purpose |
| --- | --- | --- |
| `customer_profiles_stream` | `customer_profiles.csv` | Customer identity/profile attributes. |
| `customer_orders_stream` | `customer_orders.csv` | Customer transaction/purchase events. |
| `customer_returns_stream` | `customer_returns.csv` | Returns/refund events. |
| `customer_subscriptions_stream` | `customer_subscriptions.csv` | Subscription lifecycle + MRR. |
| `customer_support_tickets_stream` | `customer_support_tickets.csv` | Service interaction history. |

### Stream schemas

#### `customer_profiles_stream`
CSV: `customer_profiles.csv`
- `id`
- `email`
- `segment`
- `region`
- `signupDate`

#### `customer_orders_stream`
CSV: `customer_orders.csv`
- `orderId`
- `customerId`
- `orderDate`
- `grossRevenue`
- `discountAmount`
- `netRevenue`

#### `customer_returns_stream`
CSV: `customer_returns.csv`
- `returnId`
- `orderId`
- `customerId`
- `returnDate`
- `refundAmount`
- `reason`

#### `customer_subscriptions_stream`
CSV: `customer_subscriptions.csv`
- `subscriptionId`
- `customerId`
- `planName`
- `mrr`
- `status`
- `startDate`
- `endDate`

#### `customer_support_tickets_stream`
CSV: `customer_support_tickets.csv`
- `ticketId`
- `customerId`
- `openedDate`
- `priority`
- `resolutionHours`
- `issueCategory`

## 2) Data Lake Objects (Raw Layer)

The raw DLO layer stays close to source shape:

- `CustomerProfile_DLO`
- `CustomerOrder_DLO`
- `CustomerReturn_DLO`
- `CustomerSubscription_DLO`
- `CustomerSupportTicket_DLO`

| DLO | Primary Key | Source Stream |
| --- | --- | --- |
| `CustomerProfile_DLO` | `id` | `customer_profiles_stream` |
| `CustomerOrder_DLO` | `orderId` | `customer_orders_stream` |
| `CustomerReturn_DLO` | `returnId` | `customer_returns_stream` |
| `CustomerSubscription_DLO` | `subscriptionId` | `customer_subscriptions_stream` |
| `CustomerSupportTicket_DLO` | `ticketId` | `customer_support_tickets_stream` |

## 3) CSV record counts

Each CSV currently contains 100 data rows (plus header row).
