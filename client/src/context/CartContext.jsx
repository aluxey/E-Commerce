import { createContext, useContext, useEffect, useState } from 'react';
import Toast from '../components/Toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState('');

  // Charge le panier depuis localStorage au premier rendu
  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        setCart(JSON.parse(stored));
      } catch {
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Persiste le panier à chaque modification
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setToast(`"${item.name}" ajouté au panier`);
    setTimeout(() => setToast(''), 3000);
  };

  const updateQuantity = (id, qty) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem }}>
      {children}
      <Toast message={toast} />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
