/**
 * Order status utilities
 * Centralizes status options and styling for orders
 */

/**
 * Status options aligned with DB schema: ('pending','paid','failed','canceled','shipped','refunded')
 * Each status has a value, translatable label key, and colors
 */
export const ORDER_STATUS_OPTIONS = [
  {
    value: 'pending',
    labelKey: 'orders.statuses.pending',
    labelFallback: 'En attente',
    color: 'var(--color-warning)',
    textColor: 'var(--color-surface)',
  },
  {
    value: 'paid',
    labelKey: 'orders.statuses.paid',
    labelFallback: 'Payée',
    color: 'var(--color-success)',
    textColor: 'var(--color-surface)',
  },
  {
    value: 'shipped',
    labelKey: 'orders.statuses.shipped',
    labelFallback: 'Expédiée',
    color: 'var(--color-accent)',
    textColor: 'var(--color-surface)',
  },
  {
    value: 'refunded',
    labelKey: 'orders.statuses.refunded',
    labelFallback: 'Remboursée',
    color: 'var(--color-complementary)',
    textColor: 'var(--color-text-primary)',
  },
  {
    value: 'canceled',
    labelKey: 'orders.statuses.canceled',
    labelFallback: 'Annulée',
    color: 'var(--color-error)',
    textColor: 'var(--color-surface)',
  },
  {
    value: 'failed',
    labelKey: 'orders.statuses.failed',
    labelFallback: 'Échec',
    color: 'color-mix(in oklab, var(--color-error) 78%, black 12%)',
    textColor: 'var(--color-surface)',
  },
];

/**
 * Get status option by value
 * @param {string} status - Status value
 * @returns {object|undefined}
 */
export const getStatusOption = (status) =>
  ORDER_STATUS_OPTIONS.find((opt) => opt.value === status);

/**
 * Get status label (translated or fallback)
 * @param {string} status - Status value
 * @param {function} t - Translation function (optional)
 * @returns {string}
 */
export const getStatusLabel = (status, t = null) => {
  const option = getStatusOption(status);
  if (!option) return status;
  return t ? t(option.labelKey, option.labelFallback) : option.labelFallback;
};

/**
 * Get inline style object for a status badge
 * @param {string} status - Status value
 * @returns {object} - CSS style object
 */
export const getStatusStyle = (status) => {
  const option = getStatusOption(status);
  return {
    backgroundColor: option?.color || 'var(--color-complementary-dark)',
    color: option?.textColor || 'var(--color-text-primary)',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
  };
};

/**
 * Build a status map for MyOrders (with translated labels)
 * @param {function} t - Translation function
 * @returns {object} - Map of status value to { label, color, text }
 */
export const buildStatusMap = (t) => {
  return ORDER_STATUS_OPTIONS.reduce((acc, opt) => {
    acc[opt.value] = {
      label: t(opt.labelKey, opt.labelFallback),
      color: opt.color,
      text: opt.textColor,
    };
    return acc;
  }, {});
};
