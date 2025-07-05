import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
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
      // ➕ Toast
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

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        showToast,
        setShowToast,
        toastMsg,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
