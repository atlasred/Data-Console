const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isNumericField(fieldName) {
  return ['grossRevenue', 'discountAmount', 'netRevenue', 'refundAmount', 'mrr'].includes(fieldName);
}

function isDateField(fieldName) {
  return fieldName.toLowerCase().endsWith('date');
}

function validateRecord(entityName, record) {
  const errors = [];

  Object.entries(record).forEach(([key, value]) => {
    if ((key === 'id' || key.toLowerCase().endsWith('id')) && (value === '' || value == null)) {
      errors.push(`${entityName}.${key} is required`);
    }

    if (isNumericField(key) && (typeof value !== 'number' || Number.isNaN(value) || value < 0)) {
      errors.push(`${entityName}.${key} must be a non-negative number`);
    }

    if (isDateField(key) && value && !DATE_RE.test(String(value))) {
      errors.push(`${entityName}.${key} must use YYYY-MM-DD`);
    }
  });

  if ('grossRevenue' in record && 'netRevenue' in record && record.netRevenue > record.grossRevenue) {
    errors.push(`${entityName}.netRevenue must be <= grossRevenue`);
  }

  if ('grossRevenue' in record && 'discountAmount' in record && record.discountAmount > record.grossRevenue) {
    errors.push(`${entityName}.discountAmount must be <= grossRevenue`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  validateRecord
};
