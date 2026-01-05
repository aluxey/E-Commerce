import { createContext } from "react";

export const CartContext = createContext({
  items: [],
  total: 0,
  itemCount: 0,
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  decreaseItem: () => {},
});