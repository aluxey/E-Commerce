import { useProduct  } from '../context/ProductContext';

export default function Cart() {
  const { cart, removeFromCart, clearCart } = useProduct ();
  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return <div className="container mt-5 text-center"><h3>Votre panier est vide 🛒</h3></div>;
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">🛍️ Mon panier</h2>
      <table className="table align-middle">
        <thead>
          <tr>
            <th>Produit</th>
            <th>Quantité</th>
            <th>Prix unitaire</th>
            <th>Sous-total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {cart.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>{(item.price / 100).toFixed(2)} €</td>
              <td>{((item.price * item.quantity) / 100).toFixed(2)} €</td>
              <td>
                <button className="btn btn-outline-danger btn-sm" onClick={() => removeFromCart(item.id)}>
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="d-flex justify-content-between align-items-center mt-4">
        <h4>Total : {(total / 100).toFixed(2)} €</h4>
        <button className="btn btn-secondary" onClick={clearCart}>
          Vider le panier
        </button>
      </div>
    </div>
  );
}
