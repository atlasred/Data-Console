/**
 * Generic reusable dimension grouping helpers.
 */

export function groupBySegment(items = [], selector = (item) => item?.segment) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const key = selector(item) || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

export function groupByRegion(items = [], selector = (item) => item?.region) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const key = selector(item) || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}

export function groupByMonth(items = [], dateSelector = (item) => item?.date) {
  return (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const raw = String(dateSelector(item) || '');
    const key = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw.slice(0, 7) : 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});
}
