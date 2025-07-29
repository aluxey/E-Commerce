import { describe, it, expect } from 'vitest';
import { addItem, updateQuantity, removeItem } from './cartUtils.js';

describe('cart utils', () => {
  it('adds a new item', () => {
    const cart = [];
    const result = addItem(cart, { id: 1, name: 'test' });
    expect(result).toEqual([{ id: 1, name: 'test', quantity: 1 }]);
  });

  it('increments quantity for existing item', () => {
    const cart = [{ id: 1, name: 'test', quantity: 1 }];
    const result = addItem(cart, { id: 1, name: 'test' });
    expect(result[0].quantity).toBe(2);
  });

  it('updates quantity', () => {
    const cart = [{ id: 1, quantity: 1 }];
    const result = updateQuantity(cart, 1, 5);
    expect(result[0].quantity).toBe(5);
  });

  it('removes item', () => {
    const cart = [{ id: 1 }, { id: 2 }];
    const result = removeItem(cart, 1);
    expect(result).toEqual([{ id: 2 }]);
  });
});
