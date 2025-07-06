import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Navbar from "./components/Navbar";
import ToastNotif from "./components/ToastNotif";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { ProductProvider } from "./context/ProductContext";

function App() {
  return (
      <AuthProvider>
        <ProductProvider>
        <BrowserRouter>
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shop" element={<Shop />} />
            <Route
              path="/product/:id"
              element={
                <PrivateRoute>
                  <Product />
                </PrivateRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <PrivateRoute>
                  <Cart />
                </PrivateRoute>
              }
            />
          </Routes>
          <ToastNotif />
        </BrowserRouter>
        </ProductProvider>
      </AuthProvider>
  );
}

export default App;
