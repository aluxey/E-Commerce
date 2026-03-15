import aboutMeSabrina640 from "../assets/optimized/about/about-me-sabrina-640.webp";
import aboutMeSabrina1280 from "../assets/optimized/about/about-me-sabrina-1280.webp";
import categoryBasket640 from "../assets/optimized/categories/category-basket-640.webp";
import categoryBasket1280 from "../assets/optimized/categories/category-basket-1280.webp";
import categoryBestseller640 from "../assets/optimized/categories/category-bestseller-640.webp";
import categoryBestseller1280 from "../assets/optimized/categories/category-bestseller-1280.webp";
import categoryCollection640 from "../assets/optimized/categories/category-collection-640.webp";
import categoryCollection1280 from "../assets/optimized/categories/category-collection-1280.webp";
import categoryWood640 from "../assets/optimized/categories/category-wood-640.webp";
import categoryWood1280 from "../assets/optimized/categories/category-wood-1280.webp";
import heroAccessories640 from "../assets/optimized/hero/hero-accessories-640.webp";
import heroAccessories1280 from "../assets/optimized/hero/hero-accessories-1280.webp";
import heroBaskets640 from "../assets/optimized/hero/hero-baskets-640.webp";
import heroBaskets1280 from "../assets/optimized/hero/hero-baskets-1280.webp";
import heroCraft640 from "../assets/optimized/hero/hero-craft-640.webp";
import heroCraft1280 from "../assets/optimized/hero/hero-craft-1280.webp";
import heroKnitwear640 from "../assets/optimized/hero/hero-knitwear-640.webp";
import heroKnitwear1280 from "../assets/optimized/hero/hero-knitwear-1280.webp";
import heroMain640 from "../assets/optimized/hero/main-pic-640.webp";
import heroMain1280 from "../assets/optimized/hero/main-pic-1280.webp";

const createResponsiveImage = (smallSrc, largeSrc, width, height) => ({
  src: largeSrc,
  srcSet: `${smallSrc} 640w, ${largeSrc} 1280w`,
  width,
  height,
});

export const HERO_IMAGES = [
  {
    ...createResponsiveImage(heroMain640, heroMain1280, 1076, 1081),
    alt: "Handgemachte Produkte",
  },
  {
    ...createResponsiveImage(heroBaskets640, heroBaskets1280, 1200, 1600),
    alt: "Handgemachte Korbe",
  },
  {
    ...createResponsiveImage(heroKnitwear640, heroKnitwear1280, 1500, 1144),
    alt: "Strickarbeiten",
  },
  {
    ...createResponsiveImage(heroAccessories640, heroAccessories1280, 1200, 1600),
    alt: "Handgefertigte Accessoires",
  },
  {
    ...createResponsiveImage(heroCraft640, heroCraft1280, 1200, 1600),
    alt: "Kunsthandwerk",
  },
];

export const CATEGORY_BESTSELLER_IMAGE = createResponsiveImage(categoryBestseller640, categoryBestseller1280, 1200, 1297);
export const CATEGORY_COLLECTION_IMAGE = createResponsiveImage(categoryCollection640, categoryCollection1280, 2016, 1168);
export const CATEGORY_WOOD_IMAGE = createResponsiveImage(categoryWood640, categoryWood1280, 1512, 1027);
export const CATEGORY_BASKET_IMAGE = createResponsiveImage(categoryBasket640, categoryBasket1280, 1200, 1600);

export const CATEGORY_IMAGES = [
  CATEGORY_BESTSELLER_IMAGE,
  CATEGORY_COLLECTION_IMAGE,
  CATEGORY_BASKET_IMAGE,
  CATEGORY_WOOD_IMAGE,
];

export const ABOUT_ME_IMAGE = createResponsiveImage(aboutMeSabrina640, aboutMeSabrina1280, 1080, 1079);

export function getResponsiveImageProps(image) {
  if (!image) return {};

  if (typeof image === "string") {
    return { src: image };
  }

  return {
    src: image.src,
    srcSet: image.srcSet,
    width: image.width,
    height: image.height,
  };
}
