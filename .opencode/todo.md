# Todo List - Sabbels Handmade

> Derniere mise a jour : 14 fevrier 2026

---

## Partie 1 -- Demandes Client

Les demandes business de Sabrina, a traiter en priorite avant les todos techniques.

---

### 1. Contenu & Medias

- [ ] **Remplacer les images des categories** -- utiliser les images envoyees le 05/01 sur WhatsApp
- [ ] **Ajouter "Pflegehinweise" (instructions d'entretien)** -- integrer dans une section dediee et/ou sur chaque fiche produit selon le modele retenu
- [x] ~~**Page "Unsere Produkte bei euch zu Hause"** (photos clients)~~ -- fait le 14/02/2026
  - [x] ~~Table `customer_photos` + migration~~
  - [x] ~~Services (public + admin)~~
  - [x] ~~Composant `CustomerPhotoWall` (grille masonry + lightbox)~~
  - [x] ~~Composant `CustomerPhotoManager` (admin: upload, reorder, toggle)~~
  - [x] ~~Pages publique (`/photos`) et admin~~
  - [x] ~~Integration Home (apercu) + MobileHome~~
  - [x] ~~Routes, nav, footer~~
  - [x] ~~i18n DE + FR~~

### 2. UX / Mobile

- [x] ~~Selecteur couleurs cliquable + accessible~~ -- swatches cliquables avec bouton "+X" et scroll horizontal sur mobile (fait le 28/01/2026)
- [ ] **Galerie mobile produit**
  - [ ] Afficher la premiere image comme visuel principal sur mobile
  - [ ] Ajouter un carrousel swipe pour les autres images

### 3. Bugs & Navigation

- [x] ~~Fix scroll on reload / navigation~~ -- reset du scroll a chaque changement de route via `ScrollToTop` (fait le 28/01/2026)

### 4. Catalogue / Collections

- [ ] **Bouton "See Kollektion"** -- afficher tous les produits regroupes par categories
  - [ ] Garder l'affichage "tous les produits"
  - [ ] Ajouter un regroupement/ordre par categorie (titres de sections + listing)
  - [ ] Definir une logique claire d'ordre des categories

### 5. Pages Legales & Conformite

> Bloquant pour la mise en production (obligatoire legalement en Allemagne).
> Impact : footer + checkout.

- [ ] **Privacy Policy / Datenschutz**
- [ ] **Legal Notice / Impressum**
- [ ] **Cancellation Policy / Widerrufsbelehrung**
- [ ] **Terms & Conditions / AGB**
- [ ] Integrer les liens dans le footer
- [ ] Integrer les liens sur la page checkout
- [ ] Verifier l'ouverture mobile + accessibilite des PDFs

### 6. Home -- Contenu Marketing

- [x] ~~**Suppression des temoignages (testimonials)**~~ -- fonctionnalite retiree, remplacee par le mur de photos clients (fait le 14/02/2026)
- [x] ~~**Bloc "customer pictures"**~~ -- section photos clients sur la page d'accueil (fait le 14/02/2026)
- [ ] **Bloc "produits disponibles a acheter maintenant"** -- mettre en avant les produits en stock / ready-to-ship
- [ ] **Info delai de fabrication 1-2 semaines**
  - [ ] Sur la page d'accueil
  - [ ] Sur la fiche produit
  - [ ] Sur la page checkout

### Dependances & Points Bloquants

- Les pages legales impactent le footer + le checkout : a planifier et integrer ensemble pour eviter les oublis.
- Certains items necessitent des precisions de Sabrina ("je t'explique mieux quand tu y es") : les noter comme dependances pour ne pas bloquer le reste.
- Les images des categories dependent de la reception des fichiers.

---

## Partie 2 -- Qualite Technique

Ameliorations techniques a traiter apres les demandes client.

---

### Haute Priorite

#### Securite API

- [ ] **Rate limiting** -- ajouter `express-rate-limit` sur tous les endpoints (surtout `/api/checkout` et `/api/contact`)
- [ ] **Validation des entrees serveur** -- ajouter Zod ou Joi pour valider le body de `/api/checkout` (types, quantite max, format cartItems)
- [ ] **Validation format JWT** -- valider le format du token avant l'appel a `supabase.auth.getUser()` dans `getUserFromAuthHeader` (`api/src/server.js`)
- [ ] **CORS strict en production** -- ne jamais accepter `origin: true`, toujours lister les origines autorisees

#### Tests

- [ ] **Configurer Vitest** -- setup de base dans `client/` avec `@testing-library/react`
- [ ] **Tests unitaires critiques**
  - [ ] CartContext (add, remove, decrease, clear)
  - [ ] `normalizeCartItems` et `gatherCartPricing` (api)
  - [ ] Services checkout
- [ ] **Tests API** -- endpoints `/api/checkout` (auth, validation, stock) et `/api/stripe/webhook` (signature, idempotence)

#### Traductions

- [ ] **Traduire les textes hardcodes dans l'admin**
  - [ ] `statusOptions` dans OrderManager
  - [ ] `STEP_LABELS` dans ProductManager
  - [ ] Labels divers dans les managers (CategoryManager, ColorManager, etc.)
- [ ] **Harmoniser les textes restants** -- checkout, cart messages, footer links

---

### Moyenne Priorite

#### Performance

- [ ] **Memoiser le value de CartContext** -- wrapper avec `useMemo` pour eviter les re-renders inutiles
- [ ] **Compression API** -- ajouter le middleware `compression` (gzip/brotli) sur Express
- [ ] **Lazy loading images** -- ajouter `loading="lazy"` sur toutes les images produits (`ItemCard`, `MiniItemCard`, `ProductDetail`)
- [ ] **Fusionner les requetes N+1** -- items + ratings en une seule requete (JOIN ou RPC Supabase) dans `ProductList`
- [ ] **Index SQL manquants** -- ajouter index sur `items.status` et `orders.status`

#### Refactoring

- [ ] **Decouper `ProductManager.jsx`** (~1250 lignes) -- extraire en sous-composants (`ProductWizard`, `ProductListAdmin`)
- [ ] **Decouper `ProductDetail.jsx`** (~600 lignes) -- extraire `ProductGallery`, `ProductInfo`, `ProductReviews`
- [ ] **Standardiser la gestion d'erreurs** -- un seul pattern partout (`error` = `string | null`, jamais boolean)
- [ ] **Centraliser les magic strings** -- statuts de commande, roles, statuts produit dans `utils/constants.js`
- [ ] **Nettoyer les alias dans CartContext** -- choisir un seul nom : `cart` ou `cartItems`, `variantId` ou `variant_id`, etc.

---

### Basse Priorite

#### Tests E2E & CI/CD

- [ ] **Configurer Playwright** -- tests E2E sur le parcours d'achat complet (catalogue -> panier -> checkout)
- [ ] **Pipeline CI/CD** -- GitHub Actions (lint, tests, build) sur chaque PR

#### Accessibilite

- [ ] **Audit axe-core** -- scanner le site et corriger les violations
- [ ] **Navigation clavier** -- verifier focus visible sur tous les elements interactifs (boutons quantite, swatches couleurs, modals)
- [ ] **Contraste couleurs** -- verifier les ratios WCAG AA sur le design system (`global.css`)

#### Nettoyage

- [ ] **Supprimer les dependances root inutilisees** -- `axios`, `bootstrap`, `react-bootstrap`, `classnames` dans le `package.json` racine
- [ ] **Supprimer `Server/Stripe.js`** -- edge function Deno legacy, remplacee par `api/src/server.js`
- [ ] **Verifier et supprimer `client/src/api/`** -- marque "legacy (a migrer)" dans la doc, verifier si la migration est terminee
- [ ] **Ajouter Prettier** -- formateur automatique pour uniformiser le style (semicolons, quotes, trailing commas)
- [ ] **ESLint plus strict** -- ajouter `no-console: warn`, renforcer les regles
- [ ] **Documentation inline** -- JSDoc sur les hooks et services principaux
