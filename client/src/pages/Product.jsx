import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext';
import axios from 'axios';

export default function Product() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`http://localhost:3001/items/${id}`)
      .then(res => {
        setProduct(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors de la récupération du produit", err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="text-center mt-5">Chargement...</div>;
  if (!product) return <div className="text-center mt-5">Produit introuvable</div>;

  return (
    <div className="container mt-5">
      <div className="row g-4">
        <div className="col-md-6">
          {product.picture && (
            <img
              src={`http://localhost:3001/uploads/${product.picture}`}
              alt={product.name}
              className="img-fluid rounded shadow"
            />
          )}
        </div>
        <div className="col-md-6">
          <h2>{product.name}</h2>
          <p className="text-muted">{product.description}</p>
          <h4 className="text-success">{(product.price / 100).toFixed(2)} €</h4>
          <button
            className="btn btn-primary mt-3"
            onClick={() => addToCart({
              id: product.id,
              name: product.name,
              price: product.price
            })}
          >
            Ajouter au panier
          </button>
        </div>
      </div>
    </div>
  );
}
