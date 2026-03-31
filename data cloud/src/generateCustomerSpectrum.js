const fs = require('fs');
const path = require('path');

const METRICS = [
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

const SPECTRUM_CUSTOMERS = [
  { id: 'cu-spectrum-001', name: 'Atlas Retail', tier: 'VIP', sessions: 140, productViews: 520, addToCart: 160, cartAbandon: 20, checkoutStarts: 130, completed: 18, purchases: 6400, repeat: 52, avgSessionMins: 18, avgLoggedMins: 16, logins: 95, logouts: 87 },
  { id: 'cu-spectrum-002', name: 'North Peak Co', tier: 'VIP', sessions: 128, productViews: 470, addToCart: 145, cartAbandon: 18, checkoutStarts: 118, completed: 14, purchases: 5300, repeat: 44, avgSessionMins: 16, avgLoggedMins: 14, logins: 88, logouts: 82 },
  { id: 'cu-spectrum-003', name: 'Granite Goods', tier: 'VIP', sessions: 118, productViews: 430, addToCart: 132, cartAbandon: 16, checkoutStarts: 109, completed: 12, purchases: 4700, repeat: 39, avgSessionMins: 15, avgLoggedMins: 13, logins: 80, logouts: 73 },
  { id: 'cu-spectrum-004', name: 'Pioneer Supply', tier: 'VIP', sessions: 110, productViews: 395, addToCart: 126, cartAbandon: 15, checkoutStarts: 101, completed: 10, purchases: 4200, repeat: 36, avgSessionMins: 15, avgLoggedMins: 12, logins: 77, logouts: 70 },
  { id: 'cu-spectrum-005', name: 'Lumen Home', tier: 'Loyal', sessions: 80, productViews: 240, addToCart: 68, cartAbandon: 10, checkoutStarts: 55, completed: 8, purchases: 860, repeat: 18, avgSessionMins: 12, avgLoggedMins: 10, logins: 52, logouts: 47 },
  { id: 'cu-spectrum-006', name: 'Aster Labs', tier: 'Loyal', sessions: 75, productViews: 230, addToCart: 64, cartAbandon: 9, checkoutStarts: 53, completed: 7, purchases: 790, repeat: 16, avgSessionMins: 11, avgLoggedMins: 9, logins: 49, logouts: 44 },
  { id: 'cu-spectrum-007', name: 'Verde Studio', tier: 'Loyal', sessions: 68, productViews: 215, addToCart: 58, cartAbandon: 8, checkoutStarts: 49, completed: 6, purchases: 720, repeat: 14, avgSessionMins: 10, avgLoggedMins: 8, logins: 47, logouts: 42 },
  { id: 'cu-spectrum-008', name: 'Summit Thread', tier: 'Loyal', sessions: 60, productViews: 195, addToCart: 51, cartAbandon: 7, checkoutStarts: 44, completed: 5, purchases: 640, repeat: 12, avgSessionMins: 9, avgLoggedMins: 8, logins: 42, logouts: 38 },
  { id: 'cu-spectrum-009', name: 'Urban Parcel', tier: 'Active', sessions: 45, productViews: 120, addToCart: 30, cartAbandon: 7, checkoutStarts: 21, completed: 3, purchases: 260, repeat: 4, avgSessionMins: 8, avgLoggedMins: 6, logins: 28, logouts: 27 },
  { id: 'cu-spectrum-010', name: 'Horizon Kits', tier: 'Active', sessions: 40, productViews: 104, addToCart: 27, cartAbandon: 6, checkoutStarts: 19, completed: 2, purchases: 210, repeat: 3, avgSessionMins: 7, avgLoggedMins: 5, logins: 24, logouts: 23 },
  { id: 'cu-spectrum-011', name: 'Aqua Trail', tier: 'Active', sessions: 36, productViews: 90, addToCart: 24, cartAbandon: 6, checkoutStarts: 17, completed: 2, purchases: 180, repeat: 2, avgSessionMins: 7, avgLoggedMins: 5, logins: 22, logouts: 21 },
  { id: 'cu-spectrum-012', name: 'Civic Craft', tier: 'Active', sessions: 30, productViews: 82, addToCart: 21, cartAbandon: 5, checkoutStarts: 15, completed: 2, purchases: 150, repeat: 2, avgSessionMins: 6, avgLoggedMins: 4, logins: 20, logouts: 19 },
  { id: 'cu-spectrum-013', name: 'Nova Start', tier: 'New', sessions: 2, productViews: 18, addToCart: 4, cartAbandon: 1, checkoutStarts: 3, completed: 1, purchases: 35, repeat: 0, avgSessionMins: 5, avgLoggedMins: 4, logins: 3, logouts: 3 },
  { id: 'cu-spectrum-014', name: 'Bloom Basket', tier: 'New', sessions: 2, productViews: 16, addToCart: 3, cartAbandon: 1, checkoutStarts: 2, completed: 1, purchases: 28, repeat: 0, avgSessionMins: 4, avgLoggedMins: 3, logins: 3, logouts: 2 },
  { id: 'cu-spectrum-015', name: 'Fresh Orbit', tier: 'New', sessions: 1, productViews: 10, addToCart: 2, cartAbandon: 1, checkoutStarts: 1, completed: 0, purchases: 0, repeat: 0, avgSessionMins: 3, avgLoggedMins: 2, logins: 2, logouts: 2 },
  { id: 'cu-spectrum-016', name: 'Nimble Nest', tier: 'New', sessions: 1, productViews: 9, addToCart: 2, cartAbandon: 0, checkoutStarts: 1, completed: 0, purchases: 0, repeat: 0, avgSessionMins: 3, avgLoggedMins: 2, logins: 2, logouts: 1 },
  { id: 'cu-spectrum-017', name: 'Drift Cart', tier: 'At Risk', sessions: 19, productViews: 140, addToCart: 40, cartAbandon: 20, checkoutStarts: 8, completed: 1, purchases: 42, repeat: 1, avgSessionMins: 6, avgLoggedMins: 4, logins: 26, logouts: 25 },
  { id: 'cu-spectrum-018', name: 'Quiet Harbor', tier: 'At Risk', sessions: 15, productViews: 95, addToCart: 25, cartAbandon: 14, checkoutStarts: 5, completed: 0, purchases: 0, repeat: 0, avgSessionMins: 5, avgLoggedMins: 3, logins: 20, logouts: 20 },
  { id: 'cu-spectrum-019', name: 'Mira Lane', tier: 'At Risk', sessions: 12, productViews: 78, addToCart: 18, cartAbandon: 10, checkoutStarts: 4, completed: 0, purchases: 0, repeat: 0, avgSessionMins: 5, avgLoggedMins: 3, logins: 16, logouts: 16 },
  { id: 'cu-spectrum-020', name: 'Orbit Last Mile', tier: 'At Risk', sessions: 0, productViews: 0, addToCart: 0, cartAbandon: 0, checkoutStarts: 0, completed: 0, purchases: 0, repeat: 0, avgSessionMins: 0, avgLoggedMins: 0, logins: 0, logouts: 0 }
];

function getRowMap(customer) {
  const cartToCheckoutRate = customer.addToCart ? ((customer.checkoutStarts / customer.addToCart) * 100) : 0;
  const checkoutToPurchaseRate = customer.checkoutStarts ? ((customer.completed / customer.checkoutStarts) * 100) : 0;

  return {
    customerId: customer.id,
    customerName: customer.name,
    sessionCount: customer.sessions,
    uniqueVisitorsOrCustomers: 1,
    productViewCount: customer.productViews,
    addToCartCount: customer.addToCart,
    cartAbandonmentCount: customer.cartAbandon,
    abandonedCartsCount: customer.cartAbandon,
    checkoutStartCount: customer.checkoutStarts,
    completedPurchaseCount: customer.completed,
    purchasesTotal: customer.purchases,
    repeatCustomerCount: customer.repeat,
    avgSessionDurationMinutes: customer.avgSessionMins,
    avgLoggedInMinutes: customer.avgLoggedMins,
    loginEventCount: customer.logins,
    logoutEventCount: customer.logouts,
    cartToCheckoutRate: Number(cartToCheckoutRate.toFixed(2)),
    checkoutToPurchaseRate: Number(checkoutToPurchaseRate.toFixed(2))
  };
}

function generateSpectrumCsv() {
  const root = path.resolve(__dirname, '..');
  const outDir = path.join(root, 'csv-exports', 'customer-spectrum');
  fs.mkdirSync(outDir, { recursive: true });

  const expected = {
    generatedAt: new Date().toISOString(),
    folder: 'csv-exports/customer-spectrum',
    filesGenerated: 0,
    expectedCategoryDistribution: {},
    expectedTopCustomersByPurchases: []
  };

  SPECTRUM_CUSTOMERS.forEach((customer, index) => {
    const fileName = `customers_spectrum_${String(index + 1).padStart(2, '0')}.csv`;
    const filePath = path.join(outDir, fileName);
    const row = getRowMap(customer);
    const lines = ['metric,value', ...METRICS.map((metric) => `${metric},${row[metric]}`)];
    fs.writeFileSync(filePath, `${lines.join('\n')}\n`);

    expected.filesGenerated += 1;
    expected.expectedCategoryDistribution[customer.tier] =
      (expected.expectedCategoryDistribution[customer.tier] || 0) + 1;
    expected.expectedTopCustomersByPurchases.push({
      customerId: customer.id,
      customerName: customer.name,
      purchasesTotal: customer.purchases
    });
  });

  expected.expectedTopCustomersByPurchases = expected.expectedTopCustomersByPurchases
    .sort((a, b) => b.purchasesTotal - a.purchasesTotal)
    .slice(0, 5);

  fs.writeFileSync(
    path.join(root, 'data', 'customer-spectrum-expected.json'),
    `${JSON.stringify(expected, null, 2)}\n`
  );

  console.log(`Generated ${expected.filesGenerated} customer spectrum CSV files at ${outDir}`);
}

generateSpectrumCsv();
