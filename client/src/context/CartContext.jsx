import { createContext, useEffect, useState } from 'react';

const CartContext = createContext();

const loadInitialCart = () => {
  try {
    const stored = localStorage.getItem('cart');
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && (item.variantId != null || item.variant_id != null))
      .map(item => ({
        ...item,
        variantId: item.variantId ?? item.variant_id,
        variant_id: item.variantId ?? item.variant_id,
        unit_price: Number(item.unit_price ?? item.price ?? 0),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch (err) {
    console.warn('Unable to load cart from storage:', err);
    return [];
  }
};

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadInitialCart);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addItem = payload => {
    if (!payload) return;

    setCart(prev => {
      // New addition with product + variant data
      if (payload.item && payload.variant) {
        const { item, variant } = payload;
        const quantityToAdd = Math.max(1, Number(payload.quantity) || 1);
        const variantId = variant.id;
        if (!item?.id || !variantId) return prev;
        const stock = variant.stock ?? null;

        const index = prev.findIndex(line => line.variantId === variantId);
        if (index !== -1) {
          const existing = prev[index];
          const nextQuantity = existing.quantity + quantityToAdd;
          if (stock != null && nextQuantity > stock) {
            return prev;
          }
          const updated = [...prev];
          updated[index] = { ...existing, quantity: nextQuantity, stock };
          return updated;
        }

        if (stock != null && quantityToAdd > stock) {
          return prev;
        }

        const newLine = {
          id: item.id,
          itemId: item.id,
          variantId,
          variant_id: variantId,
          name: item.name,
          unit_price: Number(variant.price),
          quantity: quantityToAdd,
          size: variant.size,
          color: variant.color || null,
          stock,
          image_url: item.item_images?.[0]?.image_url || item.image_url || null,
        };
        return [...prev, newLine];
      }

      // Increment existing line by variant id
      const variantId = payload.variantId ?? payload.variant_id;
      if (variantId == null) {
        return prev;
      }

      let changed = false;
      const next = prev.map(line => {
        if (line.variantId !== variantId) return line;
        const stock = line.stock ?? null;
        const nextQuantity = line.quantity + 1;
        if (stock != null && nextQuantity > stock) {
          return line;
        }
        changed = true;
        return { ...line, quantity: nextQuantity };
      });
      return changed ? next : prev;
    });
  };

  const removeItem = item => {
    if (!item) return;
    const variantId = item.variantId ?? item.variant_id;
    setCart(prev => prev.filter(line => line.variantId !== variantId));
  };

  const decreaseItem = item => {
    if (!item) return;
    const variantId = item.variantId ?? item.variant_id;
    setCart(prev =>
      prev
        .map(line => {
          if (line.variantId !== variantId) return line;
          const nextQuantity = line.quantity - 1;
          return nextQuantity > 0 ? { ...line, quantity: nextQuantity } : null;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => setCart([]);

  const value = {
    cart,
    addItem,
    removeItem,
    decreaseItem,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export { CartContext };
