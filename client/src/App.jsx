import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CartProvider } from "./context/CartContext";

import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const Home = lazy(() => import("./pages/Home"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AuthForm = lazy(() => import("./pages/AuthForm"));
const Login = lazy(() => import("./pages/Login"));
const ItemList = lazy(() => import("./pages/ProductList"));
const ItemDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const StripeCheckout = lazy(() => import("./components/Stripe"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const ProductAdmin = lazy(() => import("./components/Admin/ProductManager"));
const Profile = lazy(() => import("./pages/Profile"));
const MyOrders = lazy(() => import("./pages/MyOrders"));

import './styles/global.css';

function App() {
  return (
    <CartProvider>
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<AuthForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/client" element={<Home />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/items" element={<ItemList />} />
          <Route path="/item/:id" element={<ItemDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/orders"
            element={
              <PrivateRoute>
                <MyOrders />
              </PrivateRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <PrivateRoute>
                <StripeCheckout />
              </PrivateRoute>
            }
          />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route
            path="/admin/products"
            element={
              <PrivateRoute role="admin">
                <ProductAdmin />
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
      <Footer />
    </CartProvider>
  );
}

export default App;
