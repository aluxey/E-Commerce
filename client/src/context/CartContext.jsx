import { createContext, useContext, useState } from 'react';
import Toast from '../components/Toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState('');

  const addItem = (item) => {
    setCart((prev) => [...prev, item]);
    setToast(`"${item.name}" ajouté au panier`);
    setTimeout(() => setToast(''), 3000);
  };

  const removeItem = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <CartContext.Provider value={{ cart, addItem, removeItem }}>
      {children}
      <Toast message={toast} />
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
