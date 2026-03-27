# Business Data Model (Customer-Centric)

The ingestion layer keeps raw DLOs file-shaped, while the analytics model is business-shaped.

## Core model graph

```text
Customer
 ├── Orders
 ├── Returns
 ├── Subscriptions
 └── Support Tickets
```

## Core model objects

### 1) Customer
Root entity for identity and profile dimensions.

Fields:
- `customerId`
- `email`
- `segment`
- `region`
- `signupDate`

Source mapping:
- `CustomerProfile_DLO.id -> Customer.customerId`

### 2) Order
Purchase event object.

Fields:
- `orderId`
- `customerId`
- `orderDate`
- `grossRevenue`
- `discountAmount`
- `netRevenue`

Relationship:
- Many Orders -> One Customer

Source mapping:
- `CustomerOrder_DLO.*`

### 3) Return
Refund/return behavior object.

Fields:
- `returnId`
- `orderId`
- `customerId`
- `returnDate`
- `refundAmount`
- `reason`

Relationships:
- Many Returns -> One Customer
- Many Returns -> One Order

Source mapping:
- `CustomerReturn_DLO.*`

### 4) Subscription
Recurring billing object.

Fields:
- `subscriptionId`
- `customerId`
- `planName`
- `mrr`
- `status`
- `startDate`
- `endDate`

Relationship:
- Many Subscriptions -> One Customer

Source mapping:
- `CustomerSubscription_DLO.*`

### 5) Support Ticket
Customer service burden/history object.

Fields:
- `ticketId`
- `customerId`
- `openedDate`
- `priority`
- `resolutionHours`
- `issueCategory`

Relationship:
- Many Support Tickets -> One Customer

Source mapping:
- `CustomerSupportTicket_DLO.*`

## Validation checks (raw to modeled quality)

- Primary keys are present and unique per DLO.
- Foreign keys map to known parent entities:
  - `customerId` should reference `CustomerProfile_DLO.id`.
  - `orderId` in returns should reference `CustomerOrder_DLO.orderId`.
- Monetary fields are numeric and non-negative.
- Revenue math checks for orders:
  - `netRevenue = grossRevenue - discountAmount`.
- Date fields use `YYYY-MM-DD` and represent sensible ranges.

## Runtime materialization

These model objects are generated during ingestion and written to:
- `data/model-objects.json`

Generated entities:
- `Customer_DMO`
- `Order_DMO`
- `Return_DMO`
- `Subscription_DMO`
- `SupportTicket_DMO`
- `CustomerSnapshot_DMO`
