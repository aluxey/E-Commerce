import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { CartProvider } from "./context/CartContext";

import PrivateRoute from "./components/PrivateRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

const Home = lazy(() => import("./pages/Home"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProducts = lazy(() => import("./pages/AdminProducts"));
const AdminVariants = lazy(() => import("./pages/AdminVariants"));
const AdminCategories = lazy(() => import("./pages/AdminCategories"));
const AdminOrders = lazy(() => import("./pages/AdminOrders"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AuthForm = lazy(() => import("./pages/AuthForm"));
const Login = lazy(() => import("./pages/Login"));
const ItemList = lazy(() => import("./pages/ProductList"));
const ItemDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const StripeCheckout = lazy(() => import("./components/Stripe"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
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
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="variants" element={<AdminVariants />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
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
        </Routes>
      </Suspense>
      <Footer />
    </CartProvider>
  );
}

export default App;
