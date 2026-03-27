import { getNetRevenue, getRefundRate, isActiveSubscription, getAverageResolutionHours } from './metrics.js';
import { groupBySegment, groupByMonth } from './dimensions.js';
import { isAtRiskSegment, isHealthySegment, hasHighRefundPressure } from './rules.js';

/**
 * Build business semantic summaries from parsed DMO entities.
 * Pure function: consumes object, returns object.
 */
export function buildSemanticView(entities = {}) {
  const customers = Array.isArray(entities.Customer_DMO) ? entities.Customer_DMO : [];
  const orders = Array.isArray(entities.Order_DMO) ? entities.Order_DMO : [];
  const returns = Array.isArray(entities.Return_DMO) ? entities.Return_DMO : [];
  const subscriptions = Array.isArray(entities.Subscription_DMO) ? entities.Subscription_DMO : [];
  const tickets = Array.isArray(entities.SupportTicket_DMO) ? entities.SupportTicket_DMO : [];

  const customerById = new Map(customers.map((customer) => [String(customer.customerId), customer]));

  const totalNetRevenue = orders.reduce((sum, order) => sum + getNetRevenue(order), 0);
  const totalRefundAmount = returns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
  const activeSubscriptions = subscriptions.filter(isActiveSubscription).length;

  const avgResolutionHours = getAverageResolutionHours(tickets);
  const businessKpis = {
    totalCustomers: customers.length,
    totalOrders: orders.length,
    totalNetRevenue,
    totalRefundAmount,
    overallRefundRate: getRefundRate(totalRefundAmount, totalNetRevenue),
    activeSubscriptions,
    avgResolutionHours
  };

  const ordersWithSegment = orders.map((order) => ({
    ...order,
    segment: customerById.get(String(order.customerId))?.segment || 'Unknown'
  }));
  const returnsWithSegment = returns.map((item) => ({
    ...item,
    segment: customerById.get(String(item.customerId))?.segment || 'Unknown'
  }));
  const ticketsWithSegment = tickets.map((ticket) => ({
    ...ticket,
    segment: customerById.get(String(ticket.customerId))?.segment || 'Unknown'
  }));

  const customersBySegment = groupBySegment(customers, (customer) => customer.segment || 'Unknown');
  const ordersBySegment = groupBySegment(ordersWithSegment, (order) => order.segment);
  const returnsBySegment = groupBySegment(returnsWithSegment, (item) => item.segment);
  const ticketsBySegment = groupBySegment(ticketsWithSegment, (ticket) => ticket.segment);

  const segmentSummaries = Object.keys(customersBySegment)
    .sort()
    .map((segment) => {
      const segmentOrders = ordersBySegment[segment] || [];
      const segmentReturns = returnsBySegment[segment] || [];
      const segmentTickets = ticketsBySegment[segment] || [];
      const customerCount = (customersBySegment[segment] || []).length || 1;

      const netRevenue = segmentOrders.reduce((sum, order) => sum + getNetRevenue(order), 0);
      const refundAmount = segmentReturns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0);
      const refundRate = getRefundRate(refundAmount, netRevenue);
      const ticketRate = segmentTickets.length / customerCount;

      const summary = {
        segment,
        customerCount,
        orderCount: segmentOrders.length,
        netRevenue,
        refundAmount,
        refundRate,
        ticketRate
      };

      return {
        ...summary,
        flags: {
          atRisk: isAtRiskSegment(summary),
          healthy: isHealthySegment(summary),
          highRefundPressure: hasHighRefundPressure(summary)
        }
      };
    });

  const monthlyRevenue = Object.entries(groupByMonth(orders, (order) => order.orderDate))
    .map(([month, monthOrders]) => ({
      month,
      netRevenue: monthOrders.reduce((sum, order) => sum + getNetRevenue(order), 0)
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const monthlyRefunds = Object.entries(groupByMonth(returns, (item) => item.returnDate))
    .map(([month, monthReturns]) => ({
      month,
      refundAmount: monthReturns.reduce((sum, item) => sum + Number(item.refundAmount || 0), 0),
      refundsCount: monthReturns.length
    }))
    .sort((a, b) => a.month.localeCompare(b.month));

  const subscriptionHealth = {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions,
    activeRate: subscriptions.length ? (activeSubscriptions / subscriptions.length) * 100 : 0
  };

  const supportHealth = {
    totalTickets: tickets.length,
    avgResolutionHours,
    ticketsPerCustomer: customers.length ? tickets.length / customers.length : 0
  };

  return {
    businessKpis,
    segmentSummaries,
    monthlyRevenue,
    monthlyRefunds,
    subscriptionHealth,
    supportHealth
  };
}
