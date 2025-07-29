import { useCart } from "../context/CartContext";
import "../styles/cart.css";

export default function Cart() {
  const { cart, updateQuantity, removeItem } = useCart();

  const handleChange = (id, qty) => {
    const value = parseInt(qty, 10);
    if (!Number.isNaN(value) && value > 0) {
      updateQuantity(id, value);
    }
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="cart-page">
      <h1>Votre panier</h1>
      {cart.length === 0 ? (
        <p>Panier vide.</p>
      ) : (
        <table className="cart-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Quantité</th>
              <th>Prix</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleChange(item.id, e.target.value)}
                  />
                </td>
                <td>{(item.price * item.quantity).toFixed(2)} €</td>
                <td>
                  <button onClick={() => removeItem(item.id)}>Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="cart-total">Total : {total.toFixed(2)} €</div>
    </div>
  );
}
