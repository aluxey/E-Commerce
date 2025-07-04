import { useCart } from '../context/CartContext';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useCart();

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return <div className="container mt-5 text-center">Votre panier est vide.</div>;
  }

  return (
    <div className="container mt-5">
      <h2>Panier</h2>
      <ul className="list-group mb-3">
        {cart.map(item => (
          <li className="list-group-item d-flex justify-content-between align-items-center" key={item.id}>
            <div>
              <strong>{item.name}</strong><br />
              {item.quantity} × {item.price / 100} €
            </div>
            <button className="btn btn-sm btn-danger" onClick={() => removeFromCart(item.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
      <h4>Total : {(total / 100).toFixed(2)} €</h4>
      <button className="btn btn-secondary mt-3" onClick={clearCart}>Vider le panier</button>
    </div>
  );
}
