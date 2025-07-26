import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';

export default function DashboardStats() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    lowStockProducts: 0,
  });

  const fetchStats = async () => {
    try {
      // Total des produits
      const { count: productsCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });

      // Total des commandes
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Total des utilisateurs
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Revenus totaux
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

      // Produits en rupture de stock
      const { count: lowStockCount } = await supabase
        .from('item')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 10);

      setStats({
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalUsers: usersCount || 0,
        totalRevenue: totalRevenue,
        lowStockProducts: lowStockCount || 0,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="dashboard-stats">
      <h2>Statistiques du Dashboard</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Produits</h3>
          <p className="stat-number">{stats.totalProducts}</p>
        </div>
        <div className="stat-card">
          <h3>Commandes</h3>
          <p className="stat-number">{stats.totalOrders}</p>
        </div>
        <div className="stat-card">
          <h3>Utilisateurs</h3>
          <p className="stat-number">{stats.totalUsers}</p>
        </div>
        <div className="stat-card">
          <h3>Revenus</h3>
          <p className="stat-number">{stats.totalRevenue.toFixed(2)}€</p>
        </div>
        <div className="stat-card alert">
          <h3>Stock Faible</h3>
          <p className="stat-number">{stats.lowStockProducts}</p>
        </div>
      </div>
    </div>
  );
}
