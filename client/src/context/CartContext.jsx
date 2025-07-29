import { createContext, useContext, useEffect, useState } from 'react';
import Toast from '../components/Toast';
import { addItem as addItemUtil, updateQuantity as updateQtyUtil, removeItem as removeItemUtil } from '../utils/cartUtils.js';

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
    setCart((prev) => addItemUtil(prev, item));
    setToast(`"${item.name}" ajouté au panier`);
    setTimeout(() => setToast(''), 3000);
  };

  const updateQuantity = (id, qty) => {
    setCart((prev) => updateQtyUtil(prev, id, qty));
  };

  const removeItem = (id) => {
    setCart((prev) => removeItemUtil(prev, id));
  };

  return (
    <CartContext.Provider value={{ cart, addItem, updateQuantity, removeItem }}>
      {children}
      <Toast message={toast} />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
