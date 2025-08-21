import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from './context/CartContext';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PrivateRoute from './components/PrivateRoute';
import Navbar from "./components/Navbar";
import AuthForm from './pages/AuthForm';
import Login from "./pages/Login";
import ItemList from './pages/ProductList';
import ItemDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import StripeCheckout from '../Stripe/index';
import PaymentSuccess from './pages/PaymentSuccess';
import ProductAdmin from './components/Admin/ProductManager';
import Footer from './components/Footer';

import './styles/global.css';
import './styles/stripe.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Elements stripe={stripePromise}>
          <Navbar />
          <Routes>
            <Route path="/" element={<AuthForm />} />
            <Route path="/login" element={<Login />} />
            <Route path="/client" element={<ClientDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/items" element={<ItemList />} />
            <Route path="/item/:id" element={<ItemDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={
              <PrivateRoute>
                <StripeCheckout />
              </PrivateRoute>
            } />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/admin/products" element={
              <PrivateRoute role="admin">
                <ProductAdmin />
              </PrivateRoute>
            } />
          </Routes>
          <Footer />
        </Elements>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
