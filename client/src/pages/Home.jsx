import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Package, Sparkles, Leaf, Palette, ShieldCheck, X, ExternalLink, Wrench, Baby } from "lucide-react";
import MiniItemCard from "../components/MiniItemCard";
import HeroCarousel from "../components/HeroCarousel";
import ContactModal from "../components/ContactModal";
import { ErrorMessage, LoadingMessage } from "../components/StatusMessage";
import { fetchCategories, fetchLatestItems, fetchTopItems } from "../services/items";
import { listColors } from "../services/adminColors";
import { fetchPreviewPhotos } from "../services/customerPhotos";
import { useHomeVariant } from "../config/features";
import MobileHome from "../components/mobile/MobileHome";
import CustomerPhotoWall from "../components/CustomerPhotoWall";
import "../styles/home.css";

// Assets
import aboutMeSabrina from "../assets/aboutMeSabrina.jpeg";
import bestSellerCategoryImage from "../assets/products/WhatsApp Image 2026-01-06 at 20.35.30.jpeg";
import collectionCategoryImage from "../assets/products/WhatsApp Image 2026-02-15 at 20.53.52.jpeg";
import basketCategoryImage from "../assets/products/WhatsApp Image 2026-02-15 at 20.51.11.jpeg";
import woodBottomCategoryImage from "../assets/products/WhatsApp Image 2026-01-06 at 20.39.30.jpeg";

// Default images for categories (can be overridden by DB)
const CATEGORY_IMAGES = [
  bestSellerCategoryImage,
  collectionCategoryImage,
  basketCategoryImage,
  woodBottomCategoryImage,
];
const WOOD_CATEGORY_PATTERN = /(holz|wood|bois|holzboden|holzb[öo]den)/i;
const BESTSELLER_CATEGORY_PATTERN = /(bestseller|best seller)/i;
const COLLECTION_CATEGORY_PATTERN = /(kollektion|kollektionen|collection|collections)/i;
const BASKET_CATEGORY_PATTERN = /(k[öo]rbe|basket|paniers)/i;

const getCategoryImage = (name = "", fallbackIndex = 0) => {
  if (WOOD_CATEGORY_PATTERN.test(name)) return woodBottomCategoryImage;
  if (BESTSELLER_CATEGORY_PATTERN.test(name)) return bestSellerCategoryImage;
  if (COLLECTION_CATEGORY_PATTERN.test(name)) return collectionCategoryImage;
  if (BASKET_CATEGORY_PATTERN.test(name)) return basketCategoryImage;
  return CATEGORY_IMAGES[fallbackIndex % CATEGORY_IMAGES.length];
};

export default function Home() {
  const [latestItems, setLatestItems] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [colors, setColors] = useState([]);
  const [previewPhotos, setPreviewPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [aboutProductOpen, setAboutProductOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const { t } = useTranslation();
  const homeVariant = useHomeVariant();
  const valueProps = t("home.valueProps", { returnObjects: true }) || [];
  const heroHighlights = t("home.highlights", { returnObjects: true }) || [];
  const allItemsLink = "/items?sort=name";
  const newestItemsLink = "/items?sort=newest";
  const topItemsLink = "/items?sort=top-rated";
  const woodCategoryCard = useMemo(
    () => ({
      id: "wood-baskets",
      name: t("home.categories.wood.name", { defaultValue: "Körbe mit Holzböden" }),
      blurb: t("home.categories.wood.blurb", { defaultValue: "" }),
      image: woodBottomCategoryImage,
      link: t("home.categories.wood.link", { defaultValue: "/items?search=holz" }),
    }),
    [t]
  );

  // Fallback categories from translations (used if DB is empty)
  const fallbackCategories = (t("home.categories.cards", { returnObjects: true }) || []).map(
    (cat, idx) => ({
      ...cat,
      image: getCategoryImage(cat?.name || "", idx),
      link: cat.link || `/items?category=${encodeURIComponent(cat.name || "")}`,
    })
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(false);
        const [latestResp, topResp, categoriesResp, colorsResp, photosResp] = await Promise.all([
          fetchLatestItems(4),
          fetchTopItems(4),
          fetchCategories(),
          listColors(),
          fetchPreviewPhotos(8),
        ]);
        if (latestResp.error) throw latestResp.error;
        if (topResp.error) throw topResp.error;
        setLatestItems(latestResp.data || []);
        setTopItems(topResp.data || []);
        setColors(colorsResp.data || []);
        setPreviewPhotos(photosResp.data || []);

        const allCategories = categoriesResp.data || [];
        const mainCategories = allCategories.filter(cat => !cat.parent_id);
        const categoriesForHome = (mainCategories.length ? mainCategories : allCategories).slice(0, 4);
        setDbCategories(categoriesForHome);
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
  const baseDisplayCategories =
    dbCategories.length > 0
      ? dbCategories.map((cat, idx) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || "📦",
          blurb: t(`home.categories.blurbs.${cat.name}`, { defaultValue: "" }),
          image: getCategoryImage(cat?.name || "", idx),
          link: `/items?categoryId=${cat.id}`,
        }))
      : fallbackCategories;

  const displayCategories = useMemo(() => {
    const categories = baseDisplayCategories || [];
    const hasWoodCategory = categories.some(cat => WOOD_CATEGORY_PATTERN.test(cat?.name || ""));

    if (hasWoodCategory) {
      return categories.slice(0, 4);
    }

    return [...categories.slice(0, 3), woodCategoryCard];
  }, [baseDisplayCategories, woodCategoryCard]);

  // Render Mobile Home for mobile variant
  if (homeVariant === "mobile") {
    return (
      <MobileHome
        latestItems={latestItems}
        topItems={topItems}
        displayCategories={displayCategories}
        colors={colors}
        previewPhotos={previewPhotos}
        loading={loading}
        error={error}
      />
    );
  }

  // Desktop layout
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
              <Link to={newestItemsLink} className="btn btn-primary" aria-label={t("home.hero.ctaShop")}>
                {t("home.hero.ctaShop")}
              </Link>
              <button
                className="btn btn-secondary"
                onClick={() => setContactModalOpen(true)}
                aria-label={t("home.hero.ctaCustom")}
              >
                {t("home.hero.ctaCustom")}
              </button>
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
            <HeroCarousel />
            <div className="hero-floating-card">
              <p className="hero-floating-title">{t("home.hero.floatingTitle")}</p>
              <p className="hero-floating-text">{t("home.hero.floatingText")}</p>
            </div>
            <div className="hero-badge"><Sparkles size={16} /> {t("home.hero.badge")}</div>
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

      <section className="lead-time-strip" aria-label={t("home.leadTime.title")}>
        <div className="container lead-time-content">
          <span className="lead-time-badge">{t("home.leadTime.badge")}</span>
          <p className="lead-time-text">{t("home.leadTime.text")}</p>
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
            <Link to={allItemsLink} className="link-cta">
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
            <Link to={newestItemsLink} className="link-cta">
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

      <section className="product-section product-section--alt">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">{t("home.bestsellers.eyebrow")}</span>
              <h2>{t("home.bestsellers.title")}</h2>
              <p className="color-text-muted">{t("home.bestsellers.subtitle")}</p>
            </div>
            <Link to={topItemsLink} className="link-cta">
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

      {/* About Product Section */}
      <section className="about-product-section" id="uber-das-produkt">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="eyebrow">{t("home.aboutProduct.eyebrow")}</span>
              <h2>{t("home.aboutProduct.title")}</h2>
              <p className="color-text-muted">{t("home.aboutProduct.subtitle")}</p>
            </div>
          </div>

          <div className="about-product-preview">
            <div className="about-product-card">
              <div className="about-product-card__icon">
                <Leaf size={28} />
              </div>
              <h3>{t("home.aboutProduct.preview.materials")}</h3>
            </div>
            <div className="about-product-card">
              <div className="about-product-card__icon">
                <Palette size={28} />
              </div>
              <h3>{t("home.aboutProduct.preview.colors")}</h3>
            </div>
            <div className="about-product-card">
              <div className="about-product-card__icon">
                <ShieldCheck size={28} />
              </div>
              <h3>{t("home.aboutProduct.preview.safety")}</h3>
            </div>
          </div>

          <div className="about-product-cta">
            <button
              className="btn btn-primary"
              onClick={() => setAboutProductOpen(true)}
            >
              {t("home.aboutProduct.moreInfo")}
            </button>
          </div>
        </div>
      </section>

      {/* About Product Modal */}
      {aboutProductOpen && (
        <div className="about-product-modal-overlay" onClick={() => setAboutProductOpen(false)}>
          <div className="about-product-modal" onClick={e => e.stopPropagation()}>
            <button
              className="about-product-modal__close"
              onClick={() => setAboutProductOpen(false)}
              aria-label={t("home.aboutProduct.close")}
            >
              <X size={24} />
            </button>

            <div className="about-product-modal__content">
              {/* Materials Section */}
              <div className="about-product-modal__section">
                <div className="about-product-modal__section-header">
                  <Leaf size={24} />
                  <h3>{t("home.aboutProduct.materials.title")}</h3>
                </div>
                <p>{t("home.aboutProduct.materials.paragraph1")}</p>
                <p>{t("home.aboutProduct.materials.paragraph2")}</p>
                <p>{t("home.aboutProduct.materials.paragraph3")}</p>
                <p className="about-product-modal__highlight">{t("home.aboutProduct.materials.paragraph4")}</p>
                <div className="about-product-modal__links">
                  <a href="https://bobbiny.com" target="_blank" rel="noopener noreferrer" className="about-product-link">
                    {t("home.aboutProduct.materials.bobbinyLink")} <ExternalLink size={14} />
                  </a>
                  <a href="https://tadaskordelshop.de" target="_blank" rel="noopener noreferrer" className="about-product-link">
                    {t("home.aboutProduct.materials.tadasLink")} <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              {/* Colors Section */}
              <div className="about-product-modal__section">
                <div className="about-product-modal__section-header">
                  <Palette size={24} />
                  <h3>{t("home.aboutProduct.colors.title")}</h3>
                </div>
                <div className="about-product-colors-grid">
                  {colors.length > 0 ? (
                    colors.map(color => (
                      <div key={color.id} className="about-product-color-swatch">
                        <div
                          className="about-product-color-swatch__color"
                          style={{ backgroundColor: color.hex_code || color.hex || '#ccc' }}
                          title={color.name}
                        />
                        <span className="about-product-color-swatch__name">{color.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="about-product-color-placeholder">
                      <p className="color-text-muted">Farbpalette wird hier angezeigt</p>
                    </div>
                  )}
                </div>
                {t("home.aboutProduct.colors.note") && (
                  <p className="about-product-colors-note">{t("home.aboutProduct.colors.note")}</p>
                )}
              </div>

              {/* Safety Instructions Section */}
              <div className="about-product-modal__section">
                <div className="about-product-modal__section-header">
                  <ShieldCheck size={24} />
                  <h3>{t("home.aboutProduct.safety.title")}</h3>
                </div>
                <ul className="about-product-list about-product-list--safety">
                  {(t("home.aboutProduct.safety.items", { returnObjects: true }) || []).map((item, idx) => (
                    <li key={idx}>
                      <span className="about-product-list__icon">
                        {idx === 0 && <Wrench size={18} />}
                        {idx === 1 && <Baby size={18} />}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="about-me-section" id="about-me">
        <div className="container about-me-grid">
          <div className="about-me-visual">
            <img src={aboutMeSabrina} alt="Sabrina - Sabbels Handmade" />
          </div>
          <div className="about-me-content">
            <span className="eyebrow">{t("home.aboutMe.eyebrow")}</span>
            <h2>{t("home.aboutMe.title")}</h2>
            <p>{t("home.aboutMe.paragraph1")}</p>
            <p>{t("home.aboutMe.paragraph2")}</p>
            <p className="about-me-highlight">{t("home.aboutMe.highlight")}</p>
            <div className="about-me-actions">
              <Link to={newestItemsLink} className="btn btn-primary">
                {t("home.aboutMe.ctaShop")}
              </Link>
              <button 
                className="btn btn-ghost"
                onClick={() => setContactModalOpen(true)}
              >
                {t("home.aboutMe.ctaContact")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Photos Preview */}
      {previewPhotos.length > 0 && (
        <section className="photo-wall-preview">
          <div className="container">
            <div className="section-header">
              <div>
                <span className="eyebrow">{t("home.customerPhotos.eyebrow")}</span>
                <h2>{t("home.customerPhotos.title")}</h2>
                <p className="color-text-muted">{t("home.customerPhotos.subtitle")}</p>
              </div>
              <Link to="/photos" className="link-cta">
                {t("home.customerPhotos.seeAll")}
              </Link>
            </div>
            <CustomerPhotoWall photos={previewPhotos} preview previewLimit={8} />
          </div>
        </section>
      )}

      {/* Contact Modal */}
      <ContactModal 
        isOpen={contactModalOpen} 
        onClose={() => setContactModalOpen(false)} 
      />
    </div>
  );
}
