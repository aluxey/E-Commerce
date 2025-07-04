import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/product';
import { Link } from 'react-router-dom';

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur API :', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center mt-5">Chargement des produits...</div>;

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Notre boutique</h2>
      <div className="row">
        {products.map(product => (
          <div className="col-md-4 mb-4" key={product.id}>
            <div className="card h-100">
              <img src={product.image} className="card-img-top" alt={product.title} />
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{product.title}</h5>
                <p className="card-text">{product.description}</p>
                <p className="mt-auto fw-bold">{product.value} €</p>
                <div className="d-flex justify-content-between mt-3">
                  <Link to={`/product/${product.id}`} className="btn btn-outline-primary btn-sm">
                    Voir
                  </Link>
                  <button className="btn btn-success btn-sm">Ajouter</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
