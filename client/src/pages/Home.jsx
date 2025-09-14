import React from 'react';
import '../styles/home.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import ItemCard from '../components/ItemCard';
import MiniItemCard from '../components/MiniItemCard';

// Import des images pour le carousel
import deskOrganizer from '../assets/products/desk_organizer.jpg';
import greyBasket from '../assets/products/grey_basket.jpg';
import purpleBlackBox from '../assets/mainPic.jpg';

const carouselImages = [deskOrganizer, greyBasket, purpleBlackBox];

// Page d'accueil publique affichant les dernières nouveautés et les best sellers
export default function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [latestItems, setLatestItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Fetch sections content
  useEffect(() => {
    (async () => {
      try {
        // Derniers articles
        const { data: latest, error: latestErr } = await supabase
          .from('items')
          .select('*, item_images ( image_url )')
          .order('created_at', { ascending: false })
          .limit(8);
        if (latestErr) console.error(latestErr);

        // Top achats via RPC puis fetch des items correspondants
        const { data: topAgg, error: topErr } = await supabase
          .rpc('top_purchased_items', { limit_count: 8 });
        if (topErr) console.warn('RPC top_purchased_items indisponible:', topErr?.message);

        let topDetailed = [];
        if (topAgg?.length) {
          const ids = topAgg.map(r => r.item_id);
          const { data: items, error: itemsErr } = await supabase
            .from('items')
            .select('*, item_images ( image_url )')
            .in('id', ids);
          if (!itemsErr && items) {
            const map = new Map(items.map(i => [i.id, i]));
            topDetailed = ids.map(id => map.get(id)).filter(Boolean);
          }
        }

        setLatestItems(latest || []);
        setTopItems(topDetailed || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="container">
      {/* Sous‑navbar dédiée aux items */}
      <nav className="home-subnav" aria-label="Filtres rapides des produits">
        <Link to="/items?filter=promo" className="home-subnav__link">
          Unsere Bestseller
        </Link>
        <Link to="/items?filter=promo" className="home-subnav__link">
          Alles fürs Kinderzimmer
        </Link>
        <Link to="/items?filter=promo" className="home-subnav__link">
          Für jede Saison
        </Link>
        <Link to="/items?filter=month" className="home-subnav__link">
          Sets
        </Link>
        <Link to={`/items?category=${encodeURIComponent('Maison')}`} className="home-subnav__link">
          Über das Produkt
        </Link>
      </nav>

      {/* Hero image + slogan */}
      <section className="home-hero" aria-label="Présentation">
        <div className="hero-media">
          <img src={purpleBlackBox} alt="Produit artisanal en vedette" />
        </div>
        <div className="hero-content">
          <h1>Willkommen in meiner Häkelwelt</h1>
          <p className="hero-tagline">Deine Größe ist nicht dabei? Sende mir deinen Wunsch!</p>
          <div className="hero-actions">
            <Link to="/items" className="btn btn--primary">
              Siehe alle Produkte
            </Link>
            <a
              href="mailto:contact@sabbels-handmade.com?subject=Commande%20personnalis%C3%A9e"
              className="btn btn--ghost"
            >
              Anfragen
            </a>
          </div>
        </div>
      </section>

      {/* Zone catégories (accès rapide) */}
      <section className="home-categories" aria-label="Accès rapide catégories">
        <Link className="category-card" to="/items?filter=promo">
          <span className="category-title">Favoris</span>
        </Link>
        <Link className="category-card" to="/items?filter=month">
          <span className="category-title">Saison</span>
        </Link>
        <Link className="category-card" to={`/items?category=${encodeURIComponent('Maison')}`}>
          <span className="category-title">Maison</span>
        </Link>
        <Link className="category-card" to={`/items?category=${encodeURIComponent('Vêtement')}`}>
          <span className="category-title">Vêtements</span>
        </Link>
      </section>

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

      {/* Sections dynamiques */}
      <HomeSections loading={loading} latestItems={latestItems} topItems={topItems} />
    </div>
  );
}

function HomeSections({ loading, latestItems, topItems }) {
  return (
    <div className="home-sections">
      <section className="home-section">
        <div className="section-header">
          <h2>Derniers articles</h2>
          <Link to="/items" className="see-all">Voir tout</Link>
        </div>
        {loading ? (
          <div className="section-loading">Chargement…</div>
        ) : (
          <div className="home-row">
            {(latestItems || []).slice(0, 4).map(item => (
              <MiniItemCard key={`latest-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2>Best sellers</h2>
          <Link to="/items" className="see-all">Voir tout</Link>
        </div>
        {loading ? (
          <div className="section-loading">Chargement…</div>
        ) : topItems.length ? (
          <div className="home-row">
            {(topItems || []).slice(0, 5).map(item => (
              <MiniItemCard key={`top-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="section-empty">Pas encore de best-sellers</div>
        )}
      </section>
    </div>
  );
}
