import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchOrdersStats } from '@/services/orders';

export function useAdminStats() {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    revenue30d: 0,
    revenuePrev30d: 0,
    orders30d: 0,
    ordersPrev30d: 0,
    avgOrderValue30d: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const d30 = new Date(now);
        d30.setDate(now.getDate() - 30);
        const d60 = new Date(now);
        d60.setDate(now.getDate() - 60);

        const d30Iso = d30.toISOString();
        const d60Iso = d60.toISOString();

        const statsResponse = await fetchOrdersStats(d30Iso, d60Iso);
        if (statsResponse.error) throw statsResponse.error;
        const { ordersLast30, ordersPrev30, ordersCountLast30, ordersCountPrev30, pendingCount } = statsResponse;

        const revenue30d = (ordersLast30 || []).reduce(
          (sum, o) => sum + Number(o.total || 0),
          0
        );
        const revenuePrev30d = (ordersPrev30 || []).reduce(
          (sum, o) => sum + Number(o.total || 0),
          0
        );
        const orders30d = ordersCountLast30;
        const ordersPrev30d = ordersCountPrev30;
        const avgOrderValue30d = orders30d > 0 ? revenue30d / orders30d : 0;

        setStats({
          revenue30d,
          revenuePrev30d,
          orders30d,
          ordersPrev30d,
          avgOrderValue30d,
          pendingOrders: pendingCount || 0,
        });
      } catch (e) {
        console.error('[AdminStats] error:', e);
        setError(t('admin.dashboard.loadingError'));
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [t]);

  const computed = useMemo(() => {
    const { revenue30d, revenuePrev30d, orders30d, ordersPrev30d, avgOrderValue30d, pendingOrders } = stats;
    const fmtEUR = new Intl.NumberFormat(i18n.language === 'fr' ? 'fr-FR' : 'de-DE', {
      style: 'currency',
      currency: 'EUR',
    });

    const revenueDeltaPct = revenuePrev30d > 0
      ? ((revenue30d - revenuePrev30d) / revenuePrev30d) * 100
      : null;
    const ordersDeltaPct = ordersPrev30d > 0
      ? ((orders30d - ordersPrev30d) / ordersPrev30d) * 100
      : null;

    return {
      loading,
      error: error || null,
      // valeurs prêtes à afficher
      revenue: fmtEUR.format(revenue30d || 0),
      revenueDeltaPct,
      orders: orders30d,
      ordersDeltaPct,
      avgOrder: fmtEUR.format(avgOrderValue30d || 0),
      pendingOrders,
    };
  }, [stats, loading, error, i18n.language]);

  return computed;
}
