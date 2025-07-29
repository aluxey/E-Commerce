import React from "react";
import "../styles/home.css";

function NavBar() {
  return (
    <header className="navbar">
      <div className="container">
        <div className="logo">MaBoutique</div>
        <nav>
          <ul>
            <li><a href="#" className="active">Accueil</a></li>
            <li><a href="#">Boutique</a></li>
            <li><a href="#">À propos</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="hero-text">
        <h1>Bienvenue sur notre site e-commerce !</h1>
        <p>Découvrez notre collection unique de créations artisanales.</p>
        <button className="cta-btn">Voir nos produits</button>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="features container">
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
  );
}

function HighlightedProducts({ products }) {
  return (
    <section className="highlighted-products container">
      <h2>Produits en vedette</h2>
      <div className="product-grid">
        {products.map((product) => (
          <div key={product.id} className="product-card">
            <img src={product.image} alt={product.name} />
            <h4>{product.name}</h4>
            <p className="price">{product.price}</p>
            <button className="product-btn">Voir le produit</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <section>
          <h4>Liens utiles</h4>
          <ul className="links">
            <li><a href="#">F.A.Q.</a></li>
            <li><a href="#">Conditions Générales</a></li>
            <li><a href="#">Politique de confidentialité</a></li>
          </ul>
        </section>
        <section>
          <h4>Nous suivre</h4>
          <ul className="social">
            <li><a href="#">Facebook</a></li>
            <li><a href="#">Instagram</a></li>
            <li><a href="#">Pinterest</a></li>
          </ul>
        </section>
        <p>&copy; {new Date().getFullYear()} MaBoutique. Tous droits réservés.</p>
      </div>
    </footer>
  );
}

const mockProducts = [
  { id: 1, name: "Châle en crochet", price: "39,90€", image: "https://via.placeholder.com/300x200?text=Châle" },
  { id: 2, name: "Panier fait main", price: "24,90€", image: "https://via.placeholder.com/300x200?text=Panier" },
  { id: 3, name: "Écharpe d'hiver", price: "29,90€", image: "https://via.placeholder.com/300x200?text=Écharpe" },
];

export default function HomePage() {
  return (
    <>
      <NavBar />
      <Hero />
      <Features />
      <HighlightedProducts products={mockProducts} />
      <Footer />
    </>
  );
}
