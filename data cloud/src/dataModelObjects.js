function indexBy(records = [], key) {
  return new Map(records.map((record) => [String(record[key]), record]));
}

function toNumber(value) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function buildDataModelObjects(rawEntities = {}) {
  const profiles = rawEntities.CustomerProfile_DLO || [];
  const orders = rawEntities.CustomerOrder_DLO || [];
  const returns = rawEntities.CustomerReturn_DLO || [];
  const subscriptions = rawEntities.CustomerSubscription_DLO || [];
  const tickets = rawEntities.CustomerSupportTicket_DLO || [];

  const customersById = indexBy(profiles, 'id');
  const ordersById = indexBy(orders, 'orderId');

  const Customer_DMO = profiles.map((profile) => ({
    customerId: profile.id,
    email: profile.email,
    segment: profile.segment,
    region: profile.region,
    signupDate: profile.signupDate
  }));

  const Order_DMO = orders.map((order) => ({
    orderId: order.orderId,
    customerId: order.customerId,
    orderDate: order.orderDate,
    grossRevenue: toNumber(order.grossRevenue),
    discountAmount: toNumber(order.discountAmount),
    netRevenue: toNumber(order.netRevenue)
  }));

  const Return_DMO = returns.map((item) => {
    const matchedOrder = ordersById.get(String(item.orderId));
    const orderCustomerId = matchedOrder ? matchedOrder.customerId : null;

    return {
      returnId: item.returnId,
      orderId: item.orderId,
      customerId: item.customerId,
      returnDate: item.returnDate,
      refundAmount: toNumber(item.refundAmount),
      reason: item.reason,
      referencesKnownOrder: Boolean(matchedOrder),
      customerMatchesOrder: orderCustomerId ? String(orderCustomerId) === String(item.customerId) : false
    };
  });

  const Subscription_DMO = subscriptions.map((sub) => ({
    subscriptionId: sub.subscriptionId,
    customerId: sub.customerId,
    planName: sub.planName,
    mrr: toNumber(sub.mrr),
    status: sub.status,
    startDate: sub.startDate,
    endDate: sub.endDate
  }));

  const SupportTicket_DMO = tickets.map((ticket) => ({
    ticketId: ticket.ticketId,
    customerId: ticket.customerId,
    openedDate: ticket.openedDate,
    priority: ticket.priority,
    resolutionHours: toNumber(ticket.resolutionHours),
    issueCategory: ticket.issueCategory
  }));

  const customerSnapshots = Customer_DMO.map((customer) => {
    const customerId = String(customer.customerId);
    const customerOrders = Order_DMO.filter((order) => String(order.customerId) === customerId);
    const customerReturns = Return_DMO.filter((item) => String(item.customerId) === customerId);
    const customerSubscriptions = Subscription_DMO.filter((sub) => String(sub.customerId) === customerId);
    const customerTickets = SupportTicket_DMO.filter((ticket) => String(ticket.customerId) === customerId);

    return {
      customerId: customer.customerId,
      lifetimeNetRevenue: customerOrders.reduce((sum, order) => sum + toNumber(order.netRevenue), 0),
      totalRefunds: customerReturns.reduce((sum, item) => sum + toNumber(item.refundAmount), 0),
      activeSubscriptions: customerSubscriptions.filter((sub) => String(sub.status).toLowerCase() === 'active').length,
      ticketCount: customerTickets.length
    };
  });

  const unresolvedLinks = {
    ordersMissingCustomer: Order_DMO.filter((order) => !customersById.has(String(order.customerId))).length,
    returnsMissingOrder: Return_DMO.filter((item) => !item.referencesKnownOrder).length,
    returnsCustomerMismatch: Return_DMO.filter((item) => item.referencesKnownOrder && !item.customerMatchesOrder).length,
    subscriptionsMissingCustomer: Subscription_DMO.filter((sub) => !customersById.has(String(sub.customerId))).length,
    ticketsMissingCustomer: SupportTicket_DMO.filter((ticket) => !customersById.has(String(ticket.customerId))).length
  };

  return {
    entities: {
      Customer_DMO,
      Order_DMO,
      Return_DMO,
      Subscription_DMO,
      SupportTicket_DMO,
      CustomerSnapshot_DMO: customerSnapshots
    },
    metadata: {
      generatedAt: new Date().toISOString(),
      unresolvedLinks
    }
  };
}

module.exports = {
  buildDataModelObjects
};
