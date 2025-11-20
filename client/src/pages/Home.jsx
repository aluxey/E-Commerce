import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MiniItemCard from '../components/MiniItemCard';
import '../styles/home.css';
import { supabase } from '../supabase/supabaseClient';

// Assets
import purpleBlackBox from '../assets/mainPic.jpg';
import deskOrganizer from '../assets/products/desk_organizer.jpg';
import greyBasket from '../assets/products/grey_basket.jpg';

export default function Home() {
  const [latestItems, setLatestItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const valueProps = [
    { icon: "🧶", title: "Handgemacht", text: "Mit Liebe gestrickt und gehäkelt in Schleswig-Holstein." },
    { icon: "🎨", title: "Wunschfarben", text: "Passe Farben und Größen unkompliziert an deine Einrichtung an." },
    { icon: "🌿", title: "Natürliche Garne", text: "Wir nutzen weiche, langlebige Materialien ohne Kompromisse." },
    { icon: "💌", title: "Persönlich", text: "Direkter Kontakt und Updates bis dein Lieblingsstück ankommt." },
  ];

  const categories = [
    { name: "Wohntextilien", image: deskOrganizer, link: "/items?category=Home", blurb: "Körbe, Ordnungshilfen und gemütliche Akzente." },
    { name: "Kids & Baby", image: greyBasket, link: "/items?category=Kids", blurb: "Sanfte Garne für die Kleinsten – sicher und kuschelig." },
    { name: "Accessoires", image: purpleBlackBox, link: "/items?category=Accessories", blurb: "Kleine Lieblingsstücke für jeden Tag." },
  ];

  const heroHighlights = [
    { icon: "🤲", title: "Kleine Auflagen", text: "Jedes Stück ein Unikat" },
    { icon: "⏱️", title: "Fix versandbereit", text: "Innerhalb von 3–5 Werktagen" },
    { icon: "📦", title: "Liebevoll verpackt", text: "Versand mit Sendungsverfolgung" },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Latest Items
        const { data: latest } = await supabase
          .from('items')
          .select('*, item_images ( image_url ), item_variants ( id, size, color, price, stock )')
          .order('created_at', { ascending: false })
          .limit(4);

        // Fetch Top Items (Simulated or RPC)
        const { data: topAgg, error: topErr } = await supabase
          .rpc('top_purchased_items', { limit_count: 4 });

        let topDetailed = [];
        if (topAgg?.length) {
          const ids = topAgg.map(r => r.item_id);
          const { data: items } = await supabase
            .from('items')
            .select('*, item_images ( image_url ), item_variants ( id, size, color, price, stock )')
            .in('id', ids);

          if (items) {
            const map = new Map(items.map(i => [i.id, i]));
            topDetailed = ids.map(id => map.get(id)).filter(Boolean);
          }
        }

        setLatestItems(latest || []);
        setTopItems(topDetailed || []);
      } catch (error) {
        console.error("Error fetching home data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-shape" />
        <div className="hero-grid container">
          <div className="hero-copy animate-slide-up">
            <span className="eyebrow">Warm. Handgemacht. Persönlich.</span>
            <h1 className="hero-title">Weiche Maschen für gemütliche Momente.</h1>
            <p className="hero-subtitle">
              Körbe, Accessoires und Lieblingsstücke aus liebevoller Handarbeit – gefertigt in kleinen Auflagen
              und mit natürlichen Garnen.
            </p>
            <div className="hero-actions">
              <Link to="/items" className="btn btn-primary">
                Kollektion ansehen
              </Link>
              <Link to="/items?category=Custom" className="btn btn-secondary">
                Individuelle Anfrage
              </Link>
            </div>
            <div className="hero-highlights">
              {heroHighlights.map(highlight => (
                <div className="hero-highlight" key={highlight.title}>
                  <span className="hero-highlight__icon" aria-hidden="true">{highlight.icon}</span>
                  <div>
                    <p className="hero-highlight__title">{highlight.title}</p>
                    <p className="hero-highlight__text">{highlight.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual animate-fade-in">
            <div className="hero-photo">
              <img src={purpleBlackBox} alt="Handgemachte Körbe und Strick" />
            </div>
            <div className="hero-floating-card">
              <p className="hero-floating-title">Liebe zum Detail</p>
              <p className="hero-floating-text">Jedes Paket wird mit persönlicher Karte und nachhaltiger Verpackung verschickt.</p>
            </div>
            <div className="hero-badge">✨ Neue Farbtöne verfügbar</div>
          </div>
        </div>
      </section>

      <section className="value-strip">
        <div className="container value-grid">
          {valueProps.map(feature => (
            <div className="value-card" key={feature.title}>
              <span className="value-icon" aria-hidden="true">{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="categories-section" id="kategorien">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Kategorien</span>
              <h2>Finde dein Lieblingsstück</h2>
              <p className="text-muted">Wähle die Kategorie, die zu deinem Zuhause oder Anlass passt.</p>
            </div>
            <Link to="/items" className="link-cta">Alle Produkte ansehen →</Link>
          </div>
          <div className="categories-grid">
            {categories.map(cat => (
              <Link to={cat.link} className="category-card" key={cat.name}>
                <img src={cat.image} alt={cat.name} className="category-bg" />
                <div className="category-overlay">
                  <div className="category-text">
                    <p className="category-blurb">{cat.blurb}</p>
                    <span className="category-name">{cat.name}</span>
                  </div>
                  <span className="category-cta">Jetzt entdecken</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="product-section">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Neu im Shop</span>
              <h2>Frisch von der Nadel</h2>
              <p className="text-muted">Neue Farben, neue Formen – direkt aus dem Atelier.</p>
            </div>
            <Link to="/items" className="link-cta">Alle Neuheiten</Link>
          </div>
          {loading ? (
            <div className="text-center">Laden...</div>
          ) : latestItems.length ? (
            <div className="product-grid">
              {latestItems.map(item => (
                <MiniItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="showcase-empty">Noch keine Neuheiten verfügbar.</div>
          )}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="container story-grid">
          <div className="story-visual">
            <img src={deskOrganizer} alt="Garn und Accessoires" />
            <div className="story-note">
              <span>Handmade Studio</span>
              <p>Jede Bestellung wird in kleinen Serien gefertigt und von Hand geprüft.</p>
            </div>
          </div>
          <div className="story-content">
            <span className="eyebrow">Die Geschichte</span>
            <h2>Von der ersten Masche bis zu deinem Paket.</h2>
            <p>
              Ich bin Sabbel – Makerin, Garnliebhaberin und Detailverliebte. Was als Abendprojekt begann,
              ist heute ein kleines Label, das Wärme und Ruhe in den Alltag bringt.
            </p>
            <p>
              Meine Stücke entstehen in ruhiger Handarbeit, mit Fokus auf langlebige Materialien und eine moderne,
              nordische Ästhetik.
            </p>
            <div className="story-pills">
              <span className="story-pill">Kleine Auflagen</span>
              <span className="story-pill">Individuell anpassbar</span>
              <span className="story-pill">Nachhaltig verpackt</span>
            </div>
            <div className="story-actions">
              <Link to="/items" className="btn btn-primary">Kollektion entdecken</Link>
              <a href="mailto:contact@sabbels-handmade.com" className="btn btn-ghost">Kontakt aufnehmen</a>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section product-section--alt">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">Bestseller</span>
              <h2>Lieblinge unserer Kund:innen</h2>
              <p className="text-muted">Bewährte Klassiker, die besonders oft bestellt werden.</p>
            </div>
            <Link to="/items" className="link-cta">Alle Bestseller</Link>
          </div>
          {loading ? (
            <div className="text-center">Laden...</div>
          ) : topItems.length ? (
            <div className="product-grid">
              {topItems.map(item => (
                <MiniItemCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="showcase-empty">Bald findest du hier unsere Bestseller.</div>
          )}
        </div>
      </section>

      <section className="newsletter-section" id="newsletter">
        <div className="container newsletter-content">
          <div>
            <span className="eyebrow">Newsletter</span>
            <h2>Bleib auf dem Laufenden</h2>
            <p className="text-muted">
              Einmal im Monat erhältst du News zu neuen Farben, limitierten Drops und kleinen Einblicken in das Atelier.
            </p>
          </div>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Deine E-Mail Adresse" className="newsletter-input" required />
            <button type="submit" className="btn btn-primary">Anmelden</button>
          </form>
        </div>
      </section>
    </div>
  );
}
