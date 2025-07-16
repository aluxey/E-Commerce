
import React from "react";
import "../styles/home.css";

const mockProducts = [
  {
    id: 1,
    name: "Châle en crochet",
    price: "39,90€",
    image: "https://via.placeholder.com/300x200?text=Châle",
  },
  {
    id: 2,
    name: "Panier fait main",
    price: "24,90€",
    image: "https://via.placeholder.com/300x200?text=Panier",
  },
  {
    id: 3,
    name: "Écharpe d'hiver",
    price: "29,90€",
    image: "https://via.placeholder.com/300x200?text=Écharpe",
  },
];

export default function ClientDashboard() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>Bienvenue sur notre site e-commerce !</h1>
          <p>Découvrez notre collection unique de créations artisanales.</p>
          <button className="cta-btn">Voir nos produits</button>
        </div>
      </section>

      <section className="features">
        <div className="feature">
          <span>🧵</span>
          <h3>Fait main</h3>
          <p>Chaque produit est unique, fabriqué avec soin.</p>
        </div>
        <div className="feature">
          <span>🚚</span>
          <h3>Livraison rapide</h3>
          <p>Expédition sous 48h en France métropolitaine.</p>
        </div>
        <div className="feature">
          <span>🔒</span>
          <h3>Paiement sécurisé</h3>
          <p>Transactions protégées avec chiffrement SSL.</p>
        </div>
      </section>

      <section className="highlighted-products">
        <h2>Produits en vedette</h2>
        <div className="product-grid">
          {mockProducts.map((product) => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p className="price">{product.price}</p>
              <button className="product-btn">Voir le produit</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
