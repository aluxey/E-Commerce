import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Leaf, Palette, ShieldCheck, ExternalLink, Wrench, Baby, ChevronDown } from "lucide-react";
import ProductScroller from "./ProductScroller";
import TrustChips from "./TrustChips";
import Accordion from "./Accordion";
import "./styles/MobileHome.css";

// Assets - reuse from parent
import purpleBlackBox from "../../assets/mainPic.jpg";
import deskOrganizer from "../../assets/products/desk_organizer.jpg";
import greyBasket from "../../assets/products/grey_basket.jpg";

const CATEGORY_IMAGES = [deskOrganizer, greyBasket, purpleBlackBox];

export default function MobileHome({ 
  latestItems, 
  topItems, 
  displayCategories, 
  colors, 
  loading, 
  error 
}) {
  const { t } = useTranslation();
  const [openAccordion, setOpenAccordion] = useState(null);

  // Trust/value chips from translations
  const trustChips = [
    { icon: "🤲", text: t("home.highlights.0.title", "Handmade") },
    { icon: "🧶", text: t("home.valueProps.2.title", "Recycled Cotton") },
    { icon: "🎨", text: t("home.valueProps.1.title", "Custom Colors") },
    { icon: "📦", text: t("home.highlights.2.title", "Fast Shipping") },
  ];

  const toggleAccordion = (id) => {
    setOpenAccordion(openAccordion === id ? null : id);
  };

  return (
    <div className="mobile-home">
      {/* ============ HERO SECTION ============ */}
      <section className="mh-hero">
        <div className="mh-hero__image">
          <img 
            src={purpleBlackBox} 
            alt={t("home.hero.title")}
            loading="eager"
            fetchpriority="high"
          />
        </div>
        <div className="mh-hero__content">
          <h1 className="mh-hero__title">{t("home.hero.title")}</h1>
          <p className="mh-hero__subtitle">{t("home.hero.subtitle")}</p>
          <div className="mh-hero__actions">
            <Link to="/items" className="mh-btn mh-btn--primary">
              {t("home.hero.ctaShop")}
            </Link>
            <a
              href="mailto:contact@sabbels-handmade.com?subject=Individuelle%20Anfrage"
              className="mh-btn mh-btn--secondary"
            >
              {t("home.hero.ctaCustom")}
            </a>
          </div>
        </div>
      </section>

      {/* ============ TRUST CHIPS ============ */}
      <TrustChips chips={trustChips} />

      {/* ============ BESTSELLERS (Priority position) ============ */}
      <section className="mh-section">
        <div className="mh-section__header">
          <h2 className="mh-section__title">{t("home.bestsellers.title")}</h2>
          <Link to="/items" className="mh-section__link">
            {t("home.bestsellers.viewAll")} <ChevronRight size={16} />
          </Link>
        </div>
        <ProductScroller 
          items={topItems} 
          loading={loading} 
          emptyMessage={t("home.bestsellers.empty")}
        />
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="mh-section mh-section--alt">
        <div className="mh-section__header">
          <h2 className="mh-section__title">{t("home.categories.title")}</h2>
        </div>
        <div className="mh-categories">
          {displayCategories.slice(0, 3).map((cat, idx) => (
            <Link 
              to={cat.link} 
              className="mh-category-tile" 
              key={cat.id || cat.name}
            >
              <img 
                src={cat.image || CATEGORY_IMAGES[idx % CATEGORY_IMAGES.length]} 
                alt={cat.name}
                loading="lazy"
              />
              <div className="mh-category-tile__overlay">
                <span className="mh-category-tile__name">{cat.name}</span>
              </div>
            </Link>
          ))}
          <Link to="/items" className="mh-category-tile mh-category-tile--cta">
            <span>{t("home.categories.viewAll")}</span>
            <ChevronRight size={24} />
          </Link>
        </div>
      </section>

      {/* ============ ABOUT PRODUCT (Accordions) ============ */}
      <section className="mh-section">
        <div className="mh-section__header">
          <h2 className="mh-section__title">{t("home.aboutProduct.title")}</h2>
        </div>
        <div className="mh-accordions">
          {/* Materials */}
          <Accordion
            id="materials"
            isOpen={openAccordion === "materials"}
            onToggle={() => toggleAccordion("materials")}
            icon={<Leaf size={20} />}
            title={t("home.aboutProduct.materials.title")}
          >
            <p>{t("home.aboutProduct.materials.paragraph1")}</p>
            <p>{t("home.aboutProduct.materials.paragraph2")}</p>
            <p className="mh-highlight">{t("home.aboutProduct.materials.paragraph4")}</p>
            <div className="mh-accordion__links">
              <a href="https://bobbiny.com" target="_blank" rel="noopener noreferrer" className="mh-text-link">
                {t("home.aboutProduct.materials.bobbinyLink")} <ExternalLink size={14} />
              </a>
              <a href="https://tadaskordelshop.de" target="_blank" rel="noopener noreferrer" className="mh-text-link">
                {t("home.aboutProduct.materials.tadasLink")} <ExternalLink size={14} />
              </a>
            </div>
          </Accordion>

          {/* Colors */}
          <Accordion
            id="colors"
            isOpen={openAccordion === "colors"}
            onToggle={() => toggleAccordion("colors")}
            icon={<Palette size={20} />}
            title={t("home.aboutProduct.colors.title")}
          >
            {colors.length > 0 ? (
              <div className="mh-colors-grid">
                {colors.slice(0, 12).map(color => (
                  <div key={color.id} className="mh-color-swatch">
                    <div
                      className="mh-color-swatch__circle"
                      style={{ backgroundColor: color.hex_code || color.hex || '#ccc' }}
                      title={color.name}
                    />
                    <span className="mh-color-swatch__name">{color.name}</span>
                  </div>
                ))}
                {colors.length > 12 && (
                  <div className="mh-color-swatch mh-color-swatch--more">
                    <span>+{colors.length - 12}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="mh-muted">{t("home.aboutProduct.colors.note") || "Farbpalette verfügbar"}</p>
            )}
          </Accordion>

          {/* Safety */}
          <Accordion
            id="safety"
            isOpen={openAccordion === "safety"}
            onToggle={() => toggleAccordion("safety")}
            icon={<ShieldCheck size={20} />}
            title={t("home.aboutProduct.safety.title")}
          >
            <ul className="mh-safety-list">
              {(t("home.aboutProduct.safety.items", { returnObjects: true }) || []).map((item, idx) => (
                <li key={idx}>
                  <span className="mh-safety-list__icon">
                    {idx === 0 ? <Wrench size={16} /> : <Baby size={16} />}
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </Accordion>
        </div>
      </section>

      {/* ============ NEW ARRIVALS ============ */}
      <section className="mh-section mh-section--alt">
        <div className="mh-section__header">
          <h2 className="mh-section__title">{t("home.new.title")}</h2>
          <Link to="/items" className="mh-section__link">
            {t("home.new.viewAll")} <ChevronRight size={16} />
          </Link>
        </div>
        <ProductScroller 
          items={latestItems} 
          loading={loading} 
          emptyMessage={t("home.new.empty")}
        />
      </section>

      {/* ============ CTA BANNER ============ */}
      <section className="mh-cta-banner">
        <h2>{t("mobileHome.ctaBanner.title", "Bereit, dein Lieblingsstück zu finden?")}</h2>
        <p>{t("mobileHome.ctaBanner.subtitle", "Entdecke handgemachte Unikate aus recycelter Baumwolle.")}</p>
        <Link to="/items" className="mh-btn mh-btn--primary mh-btn--large">
          {t("mobileHome.ctaBanner.cta", "Shop entdecken")}
        </Link>
      </section>

      {/* ============ NEWSLETTER ============ */}
      <section className="mh-section mh-newsletter">
        <h2 className="mh-section__title">{t("home.newsletter.title")}</h2>
        <p className="mh-newsletter__text">{t("home.newsletter.text")}</p>
        <form className="mh-newsletter__form" onSubmit={e => e.preventDefault()}>
          <input
            type="email"
            placeholder={t("home.newsletter.placeholder")}
            className="mh-input"
            required
          />
          <button type="submit" className="mh-btn mh-btn--primary">
            {t("home.newsletter.submit")}
          </button>
        </form>
      </section>
    </div>
  );
}
