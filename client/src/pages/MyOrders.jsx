import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase/supabaseClient';
import '../styles/adminForms.css';
import { ErrorMessage, LoadingMessage } from '../components/StatusMessage';

export default function MyOrders() {
  const { session } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `
          id,
          status,
          total,
          created_at,
          order_items (
            quantity,
            items (
              id,
              name,
              price,
              item_images ( image_url )
            )
          )
        `
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (e) {
      console.error('[MyOrders] load error:', e);
      setError("Impossible de charger vos commandes.");
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const statusMap = useMemo(
    () => ({
      pending: {
        label: 'En attente',
        color: 'var(--color-warning)',
        text: 'var(--color-surface)',
      },
      paid: {
        label: 'Payée',
        color: 'var(--color-success)',
        text: 'var(--color-surface)',
      },
      shipped: {
        label: 'Expédiée',
        color: 'var(--color-accent)',
        text: 'var(--color-surface)',
      },
      refunded: {
        label: 'Remboursée',
        color: 'var(--color-complementary)',
        text: 'var(--color-text-primary)',
      },
      canceled: {
        label: 'Annulée',
        color: 'var(--color-error)',
        text: 'var(--color-surface)',
      },
      failed: {
        label: 'Échec',
        color: 'color-mix(in oklab, var(--color-error) 78%, black 12%)',
        text: 'var(--color-surface)',
      },
    }),
    []
  );

  const formatDate = d =>
    new Date(d).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const computeTotal = order => {
    if (order.total != null) return Number(order.total);
    return (
      order.order_items?.reduce(
        (sum, it) => sum + (Number(it.items?.price) || 0) * it.quantity,
        0
      ) || 0
    );
  };

  if (!session) {
    return (
      <div className="orders-shell">
        <h1>Mes commandes / Meine Bestellungen</h1>
        <p>Veuillez vous connecter pour accéder à vos commandes. / Bitte einloggen.</p>
        <Link className="btn btn-primary" to="/login">Se connecter / Anmelden</Link>
      </div>
    );
  }

  return (
    <div className="orders-shell">
      <h1>Mes commandes / Meine Bestellungen</h1>
      {loading ? (
        <LoadingMessage message="Chargement... / Laden..." />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : orders.length === 0 ? (
        <div className="order-card empty">
          <p>Aucune commande pour le moment. / Keine Bestellungen.</p>
          <Link to="/items" className="btn btn-primary">Voir les produits / Produkte ansehen</Link>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => {
            const total = computeTotal(order);
            const status = statusMap[order.status] || {
              label: order.status,
              color: 'var(--color-accent)',
              text: 'var(--color-surface)',
            };
            return (
              <div
                key={order.id}
                className="order-card"
              >
                <div className="order-card__header">
                  <div>
                    <strong>Commande #{order.id.slice(0, 8)}</strong>
                    <div className="muted">{formatDate(order.created_at)}</div>
                  </div>
                  <div className="order-card__badge">
                    <span
                      style={{
                        background: status.color,
                        color: status.text ?? 'var(--color-surface)',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {status.label}
                    </span>
                    <strong>{total.toFixed(2)} €</strong>
                  </div>
                </div>
                {order.order_items?.length ? (
                  <div className="order-items-list">
                    {order.order_items.map((it, idx) => (
                      <div key={idx} className="order-item-row">
                        <div className="order-item-thumb">
                          {it.items?.item_images?.[0]?.image_url ? (
                            <img src={it.items.item_images[0].image_url} alt={it.items?.name || 'Produit'} />
                          ) : null}
                        </div>
                        <div className="order-item-body">
                          <div className="order-item-title">{it.items?.name || 'Produit supprimé'}</div>
                          <div className="muted">Qté / Menge: {it.quantity}</div>
                        </div>
                        <div>{((Number(it.items?.price) || 0) * it.quantity).toFixed(2)} €</div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
