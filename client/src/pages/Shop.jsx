import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchProducts } from "../api/product";
import { useProduct  } from "../context/ProductContext";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useProduct ();

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur API :", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="text-center mt-5">Chargement des produits...</div>;
  }

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">Notre boutique</h2>
      <div className="row">
        {products.map((product) => (
          <div className="col-md-4 mb-4" key={product.id}>
            <div className="card h-100 shadow-sm border-0">
              {product.picture && (
                <img
                  src={`http://localhost:3001/uploads/${product.picture}`}
                  className="card-img-top"
                  alt={product.name}
                  style={{ height: "200px", objectFit: "cover" }}
                />
              )}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title">{product.name}</h5>
                <p className="card-text small text-muted">
                  {product.description}
                </p>
                <p className="fw-bold mb-2">
                  {(product.price / 100).toFixed(2)} €
                </p>
                <div className="d-grid gap-2 mt-auto">
                  <Link
                    to={`/product/${product.id}`}
                    className="btn btn-outline-primary btn-sm"
                  >
                    Voir le produit
                  </Link>
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() =>
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                      })
                    }
                  >
                    Ajouter au panier
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
