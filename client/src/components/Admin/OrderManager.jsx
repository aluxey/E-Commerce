import { useCallback, useEffect, useState } from 'react';
import { listOrders, updateOrderStatus } from '../../services/adminOrders';
import { pushToast } from '../ToastHost';
import { ErrorMessage, LoadingMessage } from '../StatusMessage';

// Statuts alignés avec le schéma DB: ('pending','paid','failed','canceled','shipped','refunded')
const statusOptions = [
  { value: 'pending',  label: 'En attente',  color: 'var(--color-warning)', text: 'var(--color-surface)' },
  { value: 'paid',     label: 'Payée',       color: 'var(--color-success)', text: 'var(--color-surface)' },
  { value: 'shipped',  label: 'Expédiée',    color: 'var(--color-accent)', text: 'var(--color-surface)' },
  { value: 'refunded', label: 'Remboursée',  color: 'var(--color-complementary)', text: 'var(--color-text-primary)' },
  { value: 'canceled', label: 'Annulée',     color: 'var(--color-error)', text: 'var(--color-surface)' },
  { value: 'failed',   label: 'Échec',       color: 'color-mix(in oklab, var(--color-error) 78%, black 12%)', text: 'var(--color-surface)' },
];

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
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
      const filtered = filterStatus === 'all' ? data : (data || []).filter(o => o.status === filterStatus);
      setOrders(filtered || []);
    } catch (err) {
      console.error('Erreur lors du chargement des commandes:', err);
      setError('Impossible de charger les commandes / Bestellungen konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

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

  const getStatusStyle = status => {
    const statusOption = statusOptions.find(option => option.value === status);
    return {
      backgroundColor: statusOption?.color || 'var(--color-complementary-dark)',
      color: statusOption?.text || 'var(--color-text-primary)',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: 600,
    };
  };

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateOrderTotal = orderItems => {
    if (!orderItems?.length) return 0;
    return orderItems.reduce((total, item) => {
      const unit = item.unit_price ?? item.items?.price ?? item.item_variants?.price ?? 0;
      return total + item.quantity * Number(unit);
    }, 0);
  };

  const formatMoney = (value, currency = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(Number(value) || 0);
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

  return (
    <div className="order-manager">
      <h2>Gestion des Commandes / Bestellungen</h2>

      <div className="order-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filtrer par statut / Nach Status filtern">
          <option value="all">Tous les statuts / Alle Status</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button onClick={fetchOrders} aria-label="Actualiser / Aktualisieren">Actualiser / Aktualisieren</button>
      </div>

      {loading && <LoadingMessage message="Chargement des commandes..." />}
      {error && !loading && <ErrorMessage title="Erreur" message={error} onRetry={fetchOrders} />}
      {!loading && !error && (
        <>
          <div className="orders-container">
            <div className="orders-list">
              <h3>Liste des commandes / Bestellungen ({orders.length})</h3>
              {orders.length === 0 ? (
                <p>Aucune commande trouvée / Keine Bestellungen</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Client</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>#{order.id.slice(0, 8)}</td>
                        <td>
                          {order.user ? order.user.email : order.customer_email}
                        </td>
                        <td>{formatDate(order.created_at)}</td>
                        <td>
                          {formatMoney(order.total ?? calculateOrderTotal(order.order_items), order.currency || 'EUR')}
                        </td>
                        <td>
                          <span style={getStatusStyle(order.status)}>
                            {statusOptions.find(s => s.value === order.status)?.label || order.status}
                          </span>
                        </td>
                        <td>
                          <button onClick={() => setSelectedOrder(order)} aria-label="Détails / Details">Détails / Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                      {statusOptions.find(s => s.value === selectedOrder.status)?.label || selectedOrder.status}
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
                      ? [item.item_variants.size, item.item_variants.color].filter(Boolean).join(' / ')
                      : null;
                    const unit = item.unit_price ?? item.items?.price ?? 0;
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
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
