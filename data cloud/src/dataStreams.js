const CUSTOMER_METRIC_HEADERS = [
  'customerId',
  'customerName',
  'sessionCount',
  'uniqueVisitorsOrCustomers',
  'productViewCount',
  'addToCartCount',
  'cartAbandonmentCount',
  'abandonedCartsCount',
  'checkoutStartCount',
  'completedPurchaseCount',
  'purchasesTotal',
  'repeatCustomerCount',
  'avgSessionDurationMinutes',
  'avgLoggedInMinutes',
  'loginEventCount',
  'logoutEventCount',
  'cartToCheckoutRate',
  'checkoutToPurchaseRate'
];

const STREAM_DEFINITIONS = [
  {
    streamName: 'customer_engagement_stream',
    filePattern: '^customers.*\\.csv$',
    expectedHeaders: CUSTOMER_METRIC_HEADERS,
    acceptedHeaderSets: [['metric', 'value']],
    format: 'auto',
    metricColumn: 'metric',
    valueColumn: 'value',
    metricMap: {
      customerId: 'customerId',
      customerName: 'customerName',
      sessionCount: 'sessionCount',
      uniqueVisitorsOrCustomers: 'uniqueVisitorsOrCustomers',
      productViewCount: 'productViewCount',
      addToCartCount: 'addToCartCount',
      cartAbandonmentCount: 'cartAbandonmentCount',
      abandonedCartsCount: 'abandonedCartsCount',
      checkoutStartCount: 'checkoutStartCount',
      completedPurchaseCount: 'completedPurchaseCount',
      purchasesTotal: 'purchasesTotal',
      repeatCustomerCount: 'repeatCustomerCount',
      avgSessionDurationMinutes: 'avgSessionDurationMinutes',
      avgLoggedInMinutes: 'avgLoggedInMinutes',
      loginEventCount: 'loginEventCount',
      logoutEventCount: 'logoutEventCount',
      cartToCheckoutRate: 'cartToCheckoutRate',
      checkoutToPurchaseRate: 'checkoutToPurchaseRate'
    },
    dloName: 'CustomerEngagement_DLO',
    primaryKey: 'customerId',
    description: 'Customer engagement and funnel metrics from admin exports.'
  }
];

module.exports = {
  STREAM_DEFINITIONS
};
