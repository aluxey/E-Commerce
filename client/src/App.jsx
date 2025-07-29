// App.jsx — corrigé
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from "./components/Navbar";
import AuthForm from './pages/AuthForm';
import Login from "./pages/Login";
import ItemList from './pages/ProductList';
import ItemDetail from './pages/ProductDetail';
import Cart from './pages/Cart';

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
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
