import React from 'react';
import '../styles/home.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import des images pour le carousel
import deskOrganizer from '../assets/products/desk_organizer.jpg';
import greyBasket from '../assets/products/grey_basket.jpg';
import purpleBlackBox from '../assets/products/purple_black_box.jpg';

const carouselImages = [deskOrganizer, greyBasket, purpleBlackBox];

export default function ClientDashboard() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide toutes les 4 sec
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 2) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIndex(prev => (prev - 2 + carouselImages.length) % carouselImages.length);
  };

  const nextSlide = () => {
    setCurrentIndex(prev => (prev + 2) % carouselImages.length);
  };

  const goToSlide = idx => {
    // Affiche idx et idx+1
    setCurrentIndex(idx);
  };

  // Les deux images à afficher
  const slideImages = [
    carouselImages[currentIndex],
    carouselImages[(currentIndex + 1) % carouselImages.length],
  ];

  return (
    <div className="container">
      <div className="header">
        <h1>Welcome sur la boutique brodée pour toi!</h1>
        <h4>Découvrez notre collection unique de créations artisanales.</h4>
        <h4>Toutes ces créations sont artisanales.</h4>
        <h4>Trouver maintenant la pièce qu'il vous manque.</h4>
        <button className="cta-btn">
          <Link to="/items" className="navbar-link">
            Voir nos produits
          </Link>
        </button>
      </div>

      {/* Carousel double */}
      <div className="carousel double">
        <button className="carousel-btn prev" onClick={prevSlide} aria-label="Précédent">
          ‹
        </button>
        <div className="carousel-slide">
          {slideImages.map((src, idx) => {
            // idx ici vaut 0 ou 1, mais on veut comparer avec currentIndex réel
            const globalIdx = (currentIndex + idx) % carouselImages.length;
            const isActive =
              globalIdx === currentIndex ||
              globalIdx === (currentIndex + 1) % carouselImages.length;
            return (
              <img
                key={globalIdx}
                src={src}
                alt={`Slide ${globalIdx + 1}`}
                className={isActive ? 'active' : 'inactive'}
              />
            );
          })}
        </div>
        <button className="carousel-btn next" onClick={nextSlide} aria-label="Suivant">
          ›
        </button>
        <div className="carousel-dots">
          {carouselImages.map((_, idx) => (
            <button
              key={idx}
              className={`dot${idx === currentIndex ? ' dot--active' : ''}`}
              onClick={() => goToSlide(idx)}
              aria-label={`Aller au slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* <section className="features">
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
          {mockProducts.map(product => (
            <div key={product.id} className="product-card">
              <img src={product.image} alt={product.name} />
              <h4>{product.name}</h4>
              <p className="price">{product.price}</p>
              <button className="product-btn">Voir le produit</button>
            </div>
          ))}
        </div>
      </section> */}
    </div>
  );
}
