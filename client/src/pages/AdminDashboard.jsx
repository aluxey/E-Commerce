import PrivateRoute from '@/components/PrivateRoute';
import ProductForm from '@/components/ProductForm';

const AdminPage = () => {
  return (
    <PrivateRoute requiredRole="admin">
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Panel Admin</h1>
        <ProductForm />
        {/* Tu peux aussi ajouter ici la liste des produits avec édition */}
      </main>
    </PrivateRoute>
  );
};

export default AdminPage;
