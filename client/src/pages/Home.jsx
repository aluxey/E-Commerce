import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import MiniItemCard from "../components/MiniItemCard";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessage";
import { fetchCategories, fetchLatestItems, fetchTopItems } from "../services/items";
import "../styles/home.css";

// Assets
import purpleBlackBox from "../assets/mainPic.jpg";
import deskOrganizer from "../assets/products/desk_organizer.jpg";
import greyBasket from "../assets/products/grey_basket.jpg";

// Default images for categories (can be overridden by DB)
const CATEGORY_IMAGES = [deskOrganizer, greyBasket, purpleBlackBox];

export default function Home() {
  const [latestItems, setLatestItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { t } = useTranslation();
  const valueProps = t("home.valueProps", { returnObjects: true }) || [];
  const heroHighlights = t("home.highlights", { returnObjects: true }) || [];

  // Fallback categories from translations (used if DB is empty)
  const fallbackCategories = (t("home.categories.cards", { returnObjects: true }) || []).map(
    (cat, idx) => ({
      ...cat,
      image: CATEGORY_IMAGES[idx] || purpleBlackBox,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(false);
        const [latestResp, topResp, categoriesResp] = await Promise.all([
          fetchLatestItems(4),
          fetchTopItems(4),
          fetchCategories(),
        ]);
        if (latestResp.error) throw latestResp.error;
        if (topResp.error) throw topResp.error;
        setLatestItems(latestResp.data || []);
        setTopItems(topResp.data || []);

        // Filter to get only main categories (no parent_id)
        const mainCategories = (categoriesResp.data || [])
          .filter(cat => !cat.parent_id)
          .slice(0, 3); // Limit to 3 for display
        setDbCategories(mainCategories);
      } catch (error) {
        console.error("Error fetching home data:", error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Build categories for display: use DB categories or fallback to translations
  const displayCategories =
    dbCategories.length > 0
      ? dbCategories.map((cat, idx) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📦",
          blurb: t(`home.categories.blurbs.${cat.name}`, { defaultValue: "" }),
          image: CATEGORY_IMAGES[idx % CATEGORY_IMAGES.length],
          link: `/items?categoryId=${cat.id}`,
        }))
      : fallbackCategories;

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-shape" />
        <div className="hero-grid container">
          <div className="hero-copy animate-slide-up">
            <span className="eyebrow">{t("home.hero.eyebrow")}</span>
            <h1 className="hero-title">{t("home.hero.title")}</h1>
            <p className="hero-subtitle">{t("home.hero.subtitle")}</p>
            <div className="hero-actions">
              <Link to="/items" className="btn btn-primary" aria-label={t("home.hero.ctaShop")}>
                {t("home.hero.ctaShop")}
              </Link>
              <a
                href="mailto:contact@sabbels-handmade.com?subject=Individuelle%20Anfrage%20-%20Sabbels%20Handmade"
                className="btn btn-secondary"
                aria-label={t("home.hero.ctaCustom")}
              >
                {t("home.hero.ctaCustom")}
              </a>
            </div>
            <div className="hero-highlights">
              {heroHighlights.map(highlight => (
                <div className="hero-highlight" key={highlight.title}>
                  <span className="hero-highlight__icon" aria-hidden="true">
                    {highlight.icon}
                  </span>
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
              <p className="hero-floating-title">{t("home.hero.floatingTitle")}</p>
              <p className="hero-floating-text">{t("home.hero.floatingText")}</p>
            </div>
            <div className="hero-badge">✨ {t("home.hero.badge")}</div>
          </div>
        </div>
      </section>

      <section className="value-strip">
        <div className="container value-grid">
          {valueProps.map(feature => (
            <div className="value-card" key={feature.title}>
              <span className="value-icon" aria-hidden="true">
                {feature.icon}
              </span>
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
              <span className="eyebrow">{t("home.categories.eyebrow")}</span>
              <h2>{t("home.categories.title")}</h2>
              <p className="color-text-muted">{t("home.categories.subtitle")}</p>
            </div>
            <Link to="/items" className="link-cta">
              {t("home.categories.viewAll")}
            </Link>
          </div>
          <div className="categories-grid">
            {displayCategories.map(cat => (
              <Link to={cat.link} className="category-card" key={cat.id || cat.name}>
                <img src={cat.image} alt={cat.name} className="category-bg" />
                <div className="category-overlay">
                  <div className="category-text">
                    <p className="category-blurb">{cat.blurb}</p>
                    <span className="category-name">{cat.name}</span>
                  </div>
                  <span className="category-cta">{t("home.categories.cta")}</span>
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
              <span className="eyebrow">{t("home.new.eyebrow")}</span>
              <h2>{t("home.new.title")}</h2>
              <p className="color-text-muted">{t("home.new.subtitle")}</p>
            </div>
            <Link to="/items" className="link-cta">
              {t("home.new.viewAll")}
            </Link>
          </div>
          {loading && <LoadingMessage />}
          {error && <ErrorMessage message={t("home.loadError")} />}
          {!loading &&
            !error &&
            (latestItems.length ? (
              <div className="product-grid">
                {latestItems.map(item => (
                  <MiniItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="showcase-empty">{t("home.new.empty")}</div>
            ))}
        </div>
      </section>

      <section className="story-section" id="story">
        <div className="container story-grid">
          <div className="story-visual">
            <img src={deskOrganizer} alt="Garn und Accessoires" />
            <div className="story-note">
              <span>{t("home.story.noteTitle")}</span>
              <p>{t("home.story.noteText")}</p>
            </div>
          </div>
          <div className="story-content">
            <span className="eyebrow">{t("home.story.eyebrow")}</span>
            <h2>{t("home.story.title")}</h2>
            <p>{t("home.story.paragraph1")}</p>
            <p>{t("home.story.paragraph2")}</p>
            <div className="story-pills">
              {(t("home.story.pills", { returnObjects: true }) || []).map(pill => (
                <span className="story-pill" key={pill}>
                  {pill}
                </span>
              ))}
            </div>
            <div className="story-actions">
              <Link to="/items" className="btn btn-primary">
                {t("home.story.ctaShop")}
              </Link>
              <a href="mailto:contact@sabbels-handmade.com" className="btn btn-ghost">
                {t("home.story.ctaContact")}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="product-section product-section--alt">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">{t("home.bestsellers.eyebrow")}</span>
              <h2>{t("home.bestsellers.title")}</h2>
              <p className="color-text-muted">{t("home.bestsellers.subtitle")}</p>
            </div>
            <Link to="/items" className="link-cta">
              {t("home.bestsellers.viewAll")}
            </Link>
          </div>
          {loading && <LoadingMessage />}
          {error && <ErrorMessage message={t("home.loadError")} />}
          {!loading &&
            !error &&
            (topItems.length ? (
              <div className="product-grid">
                {topItems.map(item => (
                  <MiniItemCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="showcase-empty">{t("home.bestsellers.empty")}</div>
            ))}
        </div>
      </section>

      <section className="newsletter-section" id="newsletter">
        <div className="container newsletter-content">
          <div>
            <span className="eyebrow">{t("home.newsletter.eyebrow")}</span>
            <h2>{t("home.newsletter.title")}</h2>
            <p className="color-text-muted">{t("home.newsletter.text")}</p>
          </div>
          <form className="newsletter-form" onSubmit={e => e.preventDefault()}>
            <input
              type="email"
              placeholder={t("home.newsletter.placeholder")}
              className="newsletter-input"
              required
            />
            <button type="submit" className="btn btn-primary">
              {t("home.newsletter.submit")}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
