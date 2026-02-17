import { useCallback, useEffect, useMemo, useState } from 'react';
import { listOrders, updateOrderStatus } from '../../services/adminOrders';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';
import { pushToast } from '../../utils/toast';
import { formatDate, formatMoney } from '../../utils/formatters';
import { ORDER_STATUS_OPTIONS, getStatusStyle, getStatusLabel } from '../../utils/orderStatus';

export default function OrderManager() {
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
      console.error('Erreur lors du chargement des commandes:', err);
      setError('Impossible de charger les commandes / Bestellungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateOrderStatusRecompute = async (orderId, newStatus) => {
    try {
      const { error: err } = await updateOrderStatus(orderId, newStatus);
      if (err) throw err;
      fetchOrders();

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      pushToast({ message: 'Statut mis à jour / Status aktualisiert', variant: 'success' });
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      pushToast({ message: 'Erreur lors de la mise à jour du statut / Aktualisierung fehlgeschlagen.', variant: 'error' });
    }
  };

  const calculateOrderTotal = orderItems => {
    if (!orderItems?.length) return 0;
    return orderItems.reduce((total, item) => {
      const unit = item.unit_price ?? item.items?.price ?? item.item_variants?.price ?? 0;
      return total + item.quantity * Number(unit);
    }, 0);
  };

  const formatAddress = addr => {
    if (!addr) return 'Non renseignée';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.name,
      addr.line1,
      addr.line2,
      addr.postal_code && `${addr.postal_code} ${addr.city || ''}`.trim(),
      addr.state,
      addr.country,
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Non renseignée';
  };

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
          <h2>Gestion des commandes</h2>
          <p className="order-subtitle">Suivi, statut et préparation des commandes.</p>
        </div>
        <div className="order-toolbar">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filtrer par statut / Nach Status filtern">
            <option value="all">Tous les statuts</option>
            {ORDER_STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.labelFallback}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={fetchOrders} aria-label="Actualiser / Aktualisieren">Actualiser</button>
        </div>
      </div>

      <div className="order-metrics">
        <div className="order-metric">
          <span className="metric-label">Commandes</span>
          <strong className="metric-value">{metrics.total}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">En attente</span>
          <strong className="metric-value">{metrics.pending}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">Payées</span>
          <strong className="metric-value">{metrics.paid}</strong>
        </div>
        <div className="order-metric">
          <span className="metric-label">Revenu estimé</span>
          <strong className="metric-value">{formatMoney(metrics.revenue, 'EUR')}</strong>
        </div>
      </div>

      {loading && <LoadingMessage message="Chargement des commandes..." />}
      {error && !loading && <ErrorMessage title="Erreur" message={error} onRetry={fetchOrders} />}
      {!loading && !error && (
        <>
          <div className="orders-container">
            <div className="orders-list">
              <div className="orders-list__header">
                <div>
                  <h3>Commandes ({orders.length})</h3>
                  <p className="order-subtitle">Clique sur une ligne pour voir le détail et mettre à jour le statut.</p>
                </div>
              </div>
              {orders.length === 0 ? (
                <p className="order-empty">Aucune commande trouvée.</p>
              ) : (
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Statut</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map(order => (
                        <tr key={order.id} onClick={() => setSelectedOrder(order)} className="order-row">
                          <td data-label="ID">#{order.id.slice(0, 8)}</td>
                          <td data-label="Client">
                            {order.user ? order.user.email : order.customer_email}
                          </td>
                          <td data-label="Date">{formatDate(order.created_at)}</td>
                          <td data-label="Total">
                            {formatMoney(order.total ?? calculateOrderTotal(order.order_items), order.currency || 'EUR')}
                          </td>
                          <td data-label="Statut">
                            <span className="status-chip" style={getStatusStyle(order.status)}>
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td data-label="Actions" className="text-right">
                            <button className="btn btn-outline btn-xs" onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}>
                              Détails
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
                    <p className="order-chip">Commande #{selectedOrder.id.slice(0, 8)}</p>
                    <h3>Détails de la commande</h3>
                    <p className="order-meta">
                      Créée le {formatDate(selectedOrder.created_at)}
                    </p>
                  </div>
                  <div className="order-status">
                    <span style={getStatusStyle(selectedOrder.status)}>
                      {getStatusLabel(selectedOrder.status)}
                    </span>
                    <button className="order-close" onClick={() => setSelectedOrder(null)} aria-label="Fermer">×</button>
                  </div>
                </div>

                <div className="order-modal__grid">
                  <div className="order-card">
                    <h4>Client</h4>
                    <p><strong>Email:</strong> {selectedOrder.user?.email || selectedOrder.customer_email || '—'}</p>
                    <p><strong>Nom:</strong> {selectedOrder.user ? `${selectedOrder.user.first_name || ''} ${selectedOrder.user.last_name || ''}`.trim() : 'Client invité'}</p>
                    <p><strong>Téléphone:</strong> {selectedOrder.customer_phone || 'N/A'}</p>
                  </div>

                  <div className="order-card">
                    <h4>Livraison</h4>
                    <p>{formatAddress(selectedOrder.shipping_address)}</p>
                  </div>

                  <div className="order-card">
                    <h4>Méthode de paiement</h4>
                    <p><strong>Payment Intent:</strong> {selectedOrder.payment_intent_id || '—'}</p>
                    <p><strong>Devise:</strong> {(selectedOrder.currency || 'eur').toUpperCase()}</p>
                  </div>
                </div>

                <div className="order-items">
                  <div className="order-items__header">
                    <h4>Articles commandés</h4>
                    <div className="order-total">
                      Total: {formatMoney(selectedOrder.total ?? calculateOrderTotal(selectedOrder.order_items), selectedOrder.currency || 'EUR')}
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
                          <span className="order-item__title">{item.items?.name || 'Produit supprimé'}</span>
                          {variantDesc && <span className="order-item__variant">{variantDesc}</span>}
                        </div>
                        <div className="order-item__meta">
                          <span>Qté {item.quantity}</span>
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
                      Dernière mise à jour le {formatDate(selectedOrder.updated_at || selectedOrder.created_at)}
                    </p>
                  </div>
                  <div className="order-status-update">
                    <label htmlFor="order-status">Modifier le statut</label>
                    <select
                      id="order-status"
                      value={selectedOrder.status}
                      onChange={e => updateOrderStatusRecompute(selectedOrder.id, e.target.value)}
                    >
                      {ORDER_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.labelFallback}
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
