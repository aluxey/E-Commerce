import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export const TABLE_ORDERS = 'orders';

export default function OrderManager() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'En attente', color: '#ffa500' },
    { value: 'confirmed', label: 'Confirmée', color: '#2196f3' },
    { value: 'processing', label: 'En traitement', color: '#ff9800' },
    { value: 'shipped', label: 'Expédiée', color: '#9c27b0' },
    { value: 'delivered', label: 'Livrée', color: '#4caf50' },
    { value: 'cancelled', label: 'Annulée', color: '#f44336' },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(
          `
          *,
          user:user_id (
            email,
            first_name,
            last_name
          ),
          order_items (
            quantity,
            price,
            items (
              name
            )
          )
        `
        )
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data } = await query;
      setOrders(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await supabase.from(TABLE_ORDERS).update({ status: newStatus }).eq('id', orderId);

      fetchOrders();

      // Mettre à jour la commande sélectionnée si c'est celle qui a été modifiée
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  const getStatusStyle = status => {
    const statusOption = statusOptions.find(option => option.value === status);
    return {
      backgroundColor: statusOption?.color || '#grey',
      color: 'white',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
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
    return orderItems?.reduce((total, item) => total + item.quantity * item.price, 0) || 0;
  };

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  return (
    <div className="order-manager">
      <h2>Gestion des Commandes</h2>

      <div className="order-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">Tous les statuts</option>
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button onClick={fetchOrders}>Actualiser</button>
      </div>

      {loading ? (
        <p>Chargement des commandes...</p>
      ) : (
        <div className="orders-container">
          <div className="orders-list">
            <h3>Liste des commandes ({orders.length})</h3>
            {orders.length === 0 ? (
              <p>Aucune commande trouvée</p>
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
                        {order.user
                          ? `${order.user.first_name} ${order.user.last_name}`
                          : order.customer_email}
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td>
                        {order.total_amount?.toFixed(2) ||
                          calculateOrderTotal(order.order_items).toFixed(2)}
                        €
                      </td>
                      <td>
                        <span style={getStatusStyle(order.status)}>
                          {statusOptions.find(s => s.value === order.status)?.label || order.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => setSelectedOrder(order)}>Détails</button>
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
                    <span>{item.item?.name || 'Produit supprimé'}</span>
                    <span>Quantité: {item.quantity}</span>
                    <span>Prix: {item.price}€</span>
                    <span>Total: {(item.quantity * item.price).toFixed(2)}€</span>
                  </div>
                ))}
                <div className="order-total">
                  <strong>
                    Total:{' '}
                    {selectedOrder.total_amount?.toFixed(2) ||
                      calculateOrderTotal(selectedOrder.order_items).toFixed(2)}
                    €
                  </strong>
                </div>
              </div>

              <div className="status-update">
                <h4>Modifier le statut</h4>
                <select
                  value={selectedOrder.status}
                  onChange={e => updateOrderStatus(selectedOrder.id, e.target.value)}
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
