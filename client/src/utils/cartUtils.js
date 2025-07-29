export function addItem(cart, item) {
  const existing = cart.find((i) => i.id === item.id);
  if (existing) {
    return cart.map((i) =>
      i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
    );
  }
  return [...cart, { ...item, quantity: 1 }];
}

export function updateQuantity(cart, id, qty) {
  return cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
}

export function removeItem(cart, id) {
  return cart.filter((i) => i.id !== id);
}
