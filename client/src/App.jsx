// App.jsx — corrigé
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import Navbar from "./components/Navbar";
import AuthForm from './pages/AuthForm';
import Login from "./pages/Login";
import ItemList from './pages/ProductList';
import ItemDetail from './pages/ProductDetail';
import ProductAdmin from './components/Admin/ProductManager';
import Footer from './components/Footer';
import { CartProvider } from './context/CartContext'; // ✅ import du provider
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Navbar />
      <Routes>
        <Route path="/" element={<AuthForm />} />
        <Route path="/login" element={<Login />} />
        <Route path="/client" element={<ClientDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/items" element={<ItemList />} />
        <Route path="/item/:id" element={<ItemDetail />} /> {/* ← ici */}
        <Route path="/admin" element={
          <PrivateRoute role="admin">
            <ProductAdmin />
          </PrivateRoute>
        } />
      </Routes>
      <Footer />
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
