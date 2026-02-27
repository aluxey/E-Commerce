import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { listOrders, updateOrderStatus } from '../../services/adminOrders';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';
import { pushToast } from '../../utils/toast';
import { formatDate, formatMoney } from '../../utils/formatters';
import { ORDER_STATUS_OPTIONS, getStatusStyle, getStatusLabel } from '../../utils/orderStatus';

export default function OrderManager() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchErr } = await listOrders();
      if (fetchErr) throw fetchErr;
      setAllOrders(data || []);
      setOrders(data || []);
    } catch (err) {
      console.error('Order loading error:', err);
      setError(t('admin.orders.error.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const updateOrderStatusRecompute = async (orderId, newStatus) => {
    try {
      const { error: err } = await updateOrderStatus(orderId, newStatus);
      if (err) throw err;
      fetchOrders();

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      pushToast({ message: t('admin.orders.success.statusUpdated'), variant: 'success' });
    } catch (err) {
      console.error('Order status update error:', err);
      pushToast({ message: t('admin.orders.error.statusUpdate'), variant: 'error' });
    }
  };

  const calculateOrderTotal = orderItems => {
    if (!orderItems?.length) return 0;
    return orderItems.reduce((total, item) => {
      const unit = item.unit_price ?? item.items?.price ?? item.item_variants?.price ?? 0;
      return total + item.quantity * Number(unit);
    }, 0);
  };

  const formatAddress = useCallback(addr => {
    if (!addr) return t('admin.orders.notProvided');
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.name,
      addr.line1,
      addr.line2,
      addr.postal_code && `${addr.postal_code} ${addr.city || ''}`.trim(),
      addr.state,
      addr.country,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : t('admin.orders.notProvided');
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const filtered = filterStatus === 'all' ? allOrders : allOrders.filter(o => o.status === filterStatus);
    setOrders(filtered);
  }, [filterStatus, allOrders]);

  const metrics = useMemo(() => {
    const total = allOrders.length;
    const pending = allOrders.filter(o => o.status === 'pending').length;
    const paid = allOrders.filter(o => o.status === 'paid').length;
    const revenue = allOrders.reduce((sum, o) => sum + Number(o.total || calculateOrderTotal(o.order_items) || 0), 0);
    return { total, pending, paid, revenue };
  }, [allOrders]);

  return (
    <div className="order-manager">
      <div className="order-header">
        <div>
          <h2>{t('admin.orders.manager.title')}</h2>
          <p className="order-subtitle">{t('admin.orders.manager.subtitle')}</p>
        </div>
        <div className="order-toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label={t('admin.orders.manager.filterByStatus')}>
            <option value="all">{t('admin.orders.manager.allStatuses')}</option>
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {t(option.labelKey, option.labelFallback)}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={fetchOrders} aria-label={t('admin.orders.manager.refresh')}>
            {t('admin.orders.manager.refresh')}
          </button>
        </div>
      </div>

      <div className="order-metrics">
        <div className="order-metric">
          <span className="metric-label">{t('admin.orders.manager.metrics.orders')}</span>
          <strong className="metric-value">{metrics.total}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">{t('admin.orders.manager.metrics.pending')}</span>
          <strong className="metric-value">{metrics.pending}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">{t('admin.orders.manager.metrics.paid')}</span>
          <strong className="metric-value">{metrics.paid}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">{t('admin.orders.manager.metrics.estimatedRevenue')}</span>
          <strong className="metric-value">{formatMoney(metrics.revenue, 'EUR')}</strong>
        </div>
      </div>

      {loading && <LoadingMessage message={t('admin.orders.loading')} />}
      {error && !loading && <ErrorMessage title={t('status.error')} message={error} onRetry={fetchOrders} />}
      {!loading && !error && (
        <>
          <div className="orders-container">
            <div className="orders-list">
              <div className="orders-list__header">
                <div>
                  <h3>{t('admin.orders.manager.listTitle', { count: orders.length })}</h3>
                  <p className="order-subtitle">{t('admin.orders.manager.listHint')}</p>
                </div>
              </div>
              {orders.length === 0 ? (
                <p className="order-empty">{t('admin.orders.manager.empty')}</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t('admin.orders.manager.columns.client')}</th>
                        <th>{t('admin.orders.manager.columns.date')}</th>
                        <th>{t('admin.orders.manager.columns.total')}</th>
                        <th>{t('admin.orders.manager.columns.status')}</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} onClick={() => setSelectedOrder(order)} className="order-row">
                          <td data-label="ID">#{order.id.slice(0, 8)}</td>
                          <td data-label={t('admin.orders.manager.columns.client')}>
                            {order.user ? order.user.email : order.customer_email}
                          </td>
                          <td data-label={t('admin.orders.manager.columns.date')}>{formatDate(order.created_at)}</td>
                          <td data-label={t('admin.orders.manager.columns.total')}>
                            {formatMoney(order.total ?? calculateOrderTotal(order.order_items), order.currency || 'EUR')}
                          </td>
                          <td data-label={t('admin.orders.manager.columns.status')}>
                            <span className="status-chip" style={getStatusStyle(order.status)}>
                              {getStatusLabel(order.status, t)}
                            </span>
                          </td>
                          <td data-label="Actions" className="text-right">
                            <button className="btn btn-outline btn-xs" onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}>
                              {t('admin.orders.manager.details')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {selectedOrder && (
            <div className="order-modal-backdrop" role="dialog" aria-modal="true" onClick={() => setSelectedOrder(null)}>
              <div className="order-modal" onClick={e => e.stopPropagation()}>
                <div className="order-modal__header">
                  <div>
                    <p className="order-chip">{t('admin.orders.manager.orderChip', { id: selectedOrder.id.slice(0, 8) })}</p>
                    <h3>{t('admin.orders.manager.orderDetailsTitle')}</h3>
                    <p className="order-meta">
                      {t('admin.orders.manager.createdOn', { date: formatDate(selectedOrder.created_at) })}
                    </p>
                  </div>
                  <div className="order-status">
                    <span style={getStatusStyle(selectedOrder.status)}>
                      {getStatusLabel(selectedOrder.status, t)}
                    </span>
                    <button className="order-close" onClick={() => setSelectedOrder(null)} aria-label={t('admin.common.close')}>×</button>
                  </div>
                </div>

                <div className="order-modal__grid">
                  <div className="order-card">
                    <h4>{t('admin.orders.manager.cards.client')}</h4>
                    <p><strong>{t('admin.orders.manager.labels.email')}</strong> {selectedOrder.user?.email || selectedOrder.customer_email || '—'}</p>
                    <p><strong>{t('admin.orders.manager.labels.name')}</strong> {selectedOrder.user ? `${selectedOrder.user.first_name || ''} ${selectedOrder.user.last_name || ''}`.trim() : t('admin.orders.guestClient')}</p>
                    <p><strong>{t('admin.orders.manager.labels.phone')}</strong> {selectedOrder.customer_phone || t('admin.orders.notAvailable')}</p>
                  </div>

                  <div className="order-card">
                    <h4>{t('admin.orders.manager.cards.shipping')}</h4>
                    <p>{formatAddress(selectedOrder.shipping_address)}</p>
                  </div>

                  <div className="order-card">
                    <h4>{t('admin.orders.manager.cards.paymentMethod')}</h4>
                    <p><strong>{t('admin.orders.manager.labels.paymentIntent')}</strong> {selectedOrder.payment_intent_id || '—'}</p>
                    <p><strong>{t('admin.orders.manager.labels.currency')}</strong> {(selectedOrder.currency || 'eur').toUpperCase()}</p>
                  </div>
                </div>

                <div className="order-items">
                  <div className="order-items__header">
                    <h4>{t('admin.orders.manager.itemsTitle')}</h4>
                    <div className="order-total">
                      {t('admin.orders.manager.totalLabel')} {formatMoney(selectedOrder.total ?? calculateOrderTotal(selectedOrder.order_items), selectedOrder.currency || 'EUR')}
                    </div>
                  </div>
                  {selectedOrder.order_items?.map(item => {
                    const variantDesc = item.item_variants
                      ? [item.item_variants.size, item.item_variants.sku].filter(Boolean).join(' • ')
                      : null;
                    const unit = item.unit_price ?? item.item_variants?.price ?? item.items?.price ?? 0;
                    return (
                      <div key={item.id} className="order-item">
                        <div className="order-item__main">
                          <span className="order-item__title">{item.items?.name || t('admin.orders.deletedProduct')}</span>
                          {variantDesc && <span className="order-item__variant">{variantDesc}</span>}
                        </div>
                        <div className="order-item__meta">
                          <span>{t('admin.orders.quantity', { count: item.quantity })}</span>
                          <span>{formatMoney(unit, selectedOrder.currency || 'EUR')}</span>
                          <strong>{formatMoney(item.quantity * unit, selectedOrder.currency || 'EUR')}</strong>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="order-footer">
                  <div>
                    <p className="order-meta">
                      {t('admin.orders.manager.lastUpdateOn', { date: formatDate(selectedOrder.updated_at || selectedOrder.created_at) })}
                    </p>
                  </div>
                  <div className="order-status-update">
                    <label htmlFor="order-status">{t('admin.orders.manager.updateStatus')}</label>
                    <select
                      id="order-status"
                      value={selectedOrder.status}
                      onChange={e => updateOrderStatusRecompute(selectedOrder.id, e.target.value)}
                    >
                      {ORDER_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {t(option.labelKey, option.labelFallback)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
