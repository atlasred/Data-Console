const STREAM_DEFINITIONS = [
  {
    streamName: 'customer_profiles_stream',
    fileName: 'customer_profiles.csv',
    expectedHeaders: ['id', 'email', 'segment', 'region', 'signupDate'],
    dloName: 'CustomerProfile_DLO',
    primaryKey: 'id',
    description: 'Customer master/profile stream (identity and profile attributes).'
  },
  {
    streamName: 'customer_orders_stream',
    fileName: 'customer_orders.csv',
    expectedHeaders: ['orderId', 'customerId', 'orderDate', 'grossRevenue', 'discountAmount', 'netRevenue'],
    dloName: 'CustomerOrder_DLO',
    primaryKey: 'orderId',
    description: 'Transaction stream (customer purchase events).'
  },
  {
    streamName: 'customer_returns_stream',
    fileName: 'customer_returns.csv',
    expectedHeaders: ['returnId', 'orderId', 'customerId', 'returnDate', 'refundAmount', 'reason'],
    dloName: 'CustomerReturn_DLO',
    primaryKey: 'returnId',
    description: 'Refund/returns stream (returned products/orders).'
  },
  {
    streamName: 'customer_subscriptions_stream',
    fileName: 'customer_subscriptions.csv',
    expectedHeaders: ['subscriptionId', 'customerId', 'planName', 'mrr', 'status', 'startDate', 'endDate'],
    dloName: 'CustomerSubscription_DLO',
    primaryKey: 'subscriptionId',
    description: 'Recurring revenue stream (subscription lifecycle and MRR).'
  },
  {
    streamName: 'customer_support_tickets_stream',
    fileName: 'customer_support_tickets.csv',
    expectedHeaders: ['ticketId', 'customerId', 'openedDate', 'priority', 'resolutionHours', 'issueCategory'],
    dloName: 'CustomerSupportTicket_DLO',
    primaryKey: 'ticketId',
    description: 'Service interaction stream (support burden and issue history).'
  }
];

module.exports = {
  STREAM_DEFINITIONS
};
