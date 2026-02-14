import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Leaf, Palette, ShieldCheck, ExternalLink, Wrench, Baby } from "lucide-react";
import ProductScroller from "./ProductScroller";
import TrustChips from "./TrustChips";
import Accordion from "./Accordion";
import ContactModal from "../ContactModal";
import CustomerPhotoWall from "../CustomerPhotoWall";
import "./styles/MobileHome.css";

// Assets
import mainPic from "../../assets/carroussel/mainPic.jpg";
import image1 from "../../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.49.jpeg";
import image2 from "../../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50.jpeg";
import image3 from "../../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50 (1).jpeg";
import image4 from "../../assets/carroussel/WhatsApp Image 2026-01-05 at 18.43.50 (2).jpeg";
import aboutMeSabrina from "../../assets/aboutMeSabrina.jpeg";
import deskOrganizer from "../../assets/products/desk_organizer.jpg";
import greyBasket from "../../assets/products/grey_basket.jpg";

const HERO_GALLERY_IMAGES = [
  { src: mainPic, alt: "Handgemachte Produkte" },
  { src: image1, alt: "Handgemachte Körbe" },
  { src: image2, alt: "Strickarbeiten" },
  { src: image3, alt: "Handgefertigte Accessoires" },
  { src: image4, alt: "Kunsthandwerk" },
];

const CATEGORY_IMAGES = [deskOrganizer, greyBasket, mainPic];

export default function MobileHome({ 
  latestItems, 
  topItems, 
  displayCategories, 
  colors,
  previewPhotos,
  loading, 
  error 
}) {
  const { t } = useTranslation();
  const [openAccordion, setOpenAccordion] = useState(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);

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
      {/* ============ 1. HERO SECTION WITH GALLERY ============ */}
      <section className="mh-hero">
        <div className="mh-hero__gallery">
          <div className="mh-hero__main-image">
            <img 
              src={HERO_GALLERY_IMAGES[0].src} 
              alt={HERO_GALLERY_IMAGES[0].alt}
              loading="eager"
              fetchpriority="high"
            />
          </div>
          <div className="mh-hero__thumbnails">
            {HERO_GALLERY_IMAGES.slice(1, 5).map((image, index) => (
              <div key={index} className="mh-hero__thumbnail">
                <img 
                  src={image.src} 
                  alt={image.alt}
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
        <div className="mh-hero__content">
          <h1 className="mh-hero__title">{t("home.hero.title")}</h1>
          <p className="mh-hero__subtitle">{t("home.hero.subtitle")}</p>
          <div className="mh-hero__actions">
            <Link to="/items" className="mh-btn mh-btn--primary">
              {t("home.hero.ctaShop")}
            </Link>
            <button
              className="mh-btn mh-btn--secondary"
              onClick={() => setContactModalOpen(true)}
            >
              {t("home.hero.ctaCustom")}
            </button>
          </div>
        </div>
      </section>

      {/* ============ 2. TRUST CHIPS (Value Props) ============ */}
      <TrustChips chips={trustChips} />

      {/* ============ 3. CATEGORIES ============ */}
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

      {/* ============ 4. NEW ARRIVALS (Neu) ============ */}
      <section className="mh-section">
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

      {/* ============ 5. BESTSELLERS ============ */}
      <section className="mh-section mh-section--alt">
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

      {/* ============ 6. ABOUT PRODUCT (Accordions) ============ */}
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

      {/* ============ 7. ABOUT ME ============ */}
      <section className="mh-section mh-about-me">
        <div className="mh-about-me__image">
          <img 
            src={aboutMeSabrina} 
            alt="Sabrina - Sabbels Handmade"
            loading="lazy"
          />
        </div>
        <div className="mh-about-me__content">
          <span className="mh-eyebrow">{t("home.aboutMe.eyebrow")}</span>
          <h2 className="mh-section__title">{t("home.aboutMe.title")}</h2>
          <p>{t("home.aboutMe.paragraph1")}</p>
          <p>{t("home.aboutMe.paragraph2")}</p>
          <p className="mh-about-me__highlight">{t("home.aboutMe.highlight")}</p>
          <div className="mh-about-me__actions">
            <Link to="/items" className="mh-btn mh-btn--primary">
              {t("home.aboutMe.ctaShop")}
            </Link>
            <button 
              className="mh-btn mh-btn--secondary"
              onClick={() => setContactModalOpen(true)}
            >
              {t("home.aboutMe.ctaContact")}
            </button>
          </div>
        </div>
      </section>

      {/* ============ 8. CUSTOMER PHOTOS ============ */}
      {previewPhotos && previewPhotos.length > 0 && (
        <section className="mh-section mh-section--alt">
          <div className="mh-section__header">
            <h2 className="mh-section__title">{t("home.customerPhotos.title")}</h2>
            <Link to="/photos" className="mh-section__link">
              {t("home.customerPhotos.seeAll")} <ChevronRight size={16} />
            </Link>
          </div>
          <CustomerPhotoWall photos={previewPhotos} preview previewLimit={6} />
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
