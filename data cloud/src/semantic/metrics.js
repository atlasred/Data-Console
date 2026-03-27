/**
 * Shared business metric helpers for the DMO semantic layer.
 * All helpers are pure and defensive.
 */

export function getNetRevenue(order = {}) {
  const gross = Number(order.grossRevenue ?? 0);
  const discount = Number(order.discountAmount ?? 0);
  return (Number.isNaN(gross) ? 0 : gross) - (Number.isNaN(discount) ? 0 : discount);
}

export function getRefundRate(refundAmount = 0, netRevenue = 0) {
  const refund = Number(refundAmount ?? 0);
  const net = Number(netRevenue ?? 0);
  if (Number.isNaN(refund) || Number.isNaN(net) || net <= 0) {
    return 0;
  }
  return (refund / net) * 100;
}

export function isActiveSubscription(subscription = {}) {
  return String(subscription.status || '').toLowerCase() === 'active';
}

export function getAverageResolutionHours(tickets = []) {
  if (!Array.isArray(tickets) || tickets.length === 0) {
    return 0;
  }

  const total = tickets.reduce((sum, ticket) => {
    const value = Number(ticket.resolutionHours ?? 0);
    return sum + (Number.isNaN(value) ? 0 : value);
  }, 0);

  return total / tickets.length;
}

export function sumRevenueBySegment(customers = [], orders = []) {
  const customerSegment = new Map(
    (Array.isArray(customers) ? customers : []).map((customer) => [String(customer.customerId), customer.segment || 'Unknown'])
  );

  return (Array.isArray(orders) ? orders : []).reduce((acc, order) => {
    const segment = customerSegment.get(String(order.customerId)) || 'Unknown';
    const net = getNetRevenue(order);
    acc[segment] = (acc[segment] || 0) + net;
    return acc;
  }, {});
}
