import PrivateRoute from '@/components/PrivateRoute';
import DashboardStats from '@/components/Admin/DashboardStats';
import ProductManager from '@/components/Admin/ProductManager';
import VariantManager from '@/components/Admin/VariantManager';
import CategoryManager from '@/components/Admin/CategoryManager';
import OrderManager from '@/components/Admin/OrderManager';
import UserManager from '@/components/Admin/UserManager';
import '../styles/Admin.css';

const AdminPage = () => {
  return (
    <PrivateRoute requiredRole="admin">
      <main className="admin-container">
        <h1>Panel Admin - Contrôle total</h1>
        <section>
          <DashboardStats />
        </section>

        <section>
          <h2>Produits</h2>
          <ProductManager />
        </section>
        <section>
          <h2>Variantes</h2>
          <VariantManager />
        </section>
        <section>
          <h2>Catégories</h2>
          <CategoryManager />
        </section>
        <section>
          <h2>Commandes</h2>
          <OrderManager />
        </section>
        <section>
          <h2>Utilisateurs</h2>
          <UserManager />
        </section>
      </main>
    </PrivateRoute>
  );
};

export default AdminPage;
