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
    return (
      orderItems?.reduce(
        (total, item) => total + item.quantity * (item.items?.price ?? 0),
        0
      ) || 0
    );
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
                        {(order.total ?? calculateOrderTotal(order.order_items)).toFixed(2)}
                        €
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

          {selectedOrder && (
            <div className="order-details">
              <h3>Détails de la commande #{selectedOrder.id.slice(0, 8)}</h3>

              <div className="order-info">
                <h4>Informations client</h4>
                <p>
                  <strong>Email:</strong>{' '}
                  {selectedOrder.user?.email || selectedOrder.customer_email}
                </p>
                <p>
                  <strong>Nom:</strong>{' '}
                  {selectedOrder.user
                    ? `${selectedOrder.user.first_name} ${selectedOrder.user.last_name}`
                    : 'Client invité'}
                </p>
                <p>
                  <strong>Téléphone:</strong> {selectedOrder.customer_phone || 'N/A'}
                </p>
              </div>

              <div className="shipping-info">
                <h4>Adresse de livraison</h4>
                <p>{selectedOrder.shipping_address || 'Non renseignée'}</p>
              </div>

              <div className="order-items">
                <h4>Articles commandés</h4>
                {selectedOrder.order_items?.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.items?.name || 'Produit supprimé'}</span>
                    <span>Quantité: {item.quantity}</span>
                    <span>Prix: {item.items?.price ?? 0}€</span>
                    <span>Total: {(item.quantity * (item.items?.price ?? 0)).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="order-total">
                  <strong>
                    Total: {(selectedOrder.total ?? calculateOrderTotal(selectedOrder.order_items)).toFixed(2)}
                    €
                  </strong>
                </div>
              </div>

              <div className="status-update">
                <h4>Modifier le statut</h4>
                <select
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

              <button onClick={() => setSelectedOrder(null)}>Fermer les détails</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
