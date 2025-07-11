// src/context/ProductContext.jsx

import { createContext, useContext, useState, useEffect } from "react";

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === item.id);
      let updated;
      if (exists) {
        updated = prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      } else {
        updated = [...prev, { ...item, quantity: 1 }];
      }
      setToastMsg(`✅ ${item.name} ajouté au panier`);
      setShowToast(true);
      return updated;
    });
  };

  const removeFromCart = (id) => {
    const itemToRemove = cart.find((p) => p.id === id);
    setCart((prev) => prev.filter((p) => p.id !== id));
    if (itemToRemove) {
      setToastMsg(`❌ ${itemToRemove.name} supprimé du panier`);
      setShowToast(true);
    }
  };

  const clearCart = () => {
    setCart([]);
    setToastMsg(`🗑️ Panier vidé`);
    setShowToast(true);
  };

  return (
    <ProductContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        showToast,
        toastMsg,
        setShowToast,
        setToastMsg,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProduct = () => useContext(ProductContext);
