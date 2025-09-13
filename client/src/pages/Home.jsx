import React from 'react';
import '../styles/home.css';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase/supabaseClient';
import ItemCard from '../components/ItemCard';

// Import des images pour le carousel
import deskOrganizer from '../assets/products/desk_organizer.jpg';
import greyBasket from '../assets/products/grey_basket.jpg';
import purpleBlackBox from '../assets/products/purple_black_box.jpg';

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
      <div className="header">
        <h1>Bienvenue chez Sabbels Handmade !</h1>
        <h4>Des créations artisanales uniques pour votre quotidien.</h4>
        <h4>Chaque pièce est réalisée à la main avec passion.</h4>
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

      {/* Sections dynamiques */}
      <HomeSections
        loading={loading}
        latestItems={latestItems}
        topItems={topItems}
      />
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
          <div className="grid">
            {latestItems.map(item => (
              <ItemCard key={`latest-${item.id}`} item={item} />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <div className="section-header">
          <h2>Top achats</h2>
        </div>
        {loading ? (
          <div className="section-loading">Chargement…</div>
        ) : topItems.length ? (
          <div className="grid">
            {topItems.map(item => (
              <ItemCard key={`top-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <div className="section-empty">Pas encore de best-sellers</div>
        )}
      </section>
    </div>
  );
}
