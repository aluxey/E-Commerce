# Contexte du Projet - Sabbels Handmade

> Ce fichier decrit le projet dans son ensemble : objectifs, architecture, fonctionnalites cote utilisateur et cote admin, base de donnees, flux metier et deploiement.

---

## 1. Presentation

**Sabbels Handmade** est une plateforme e-commerce B2C pour la vente de produits artisanaux faits main (crochet, textile). Le projet est porte par Sabrina Loeber et cible les marches allemand et francais.

- **Produits** : paniers, organisateurs, accessoires textile, peluches amigurumi, articles bebe, decoration.
- **Langues** : allemand (par defaut) et francais.
- **Monnaie** : EUR.
- **Modele** : vente directe, articles fabriques a la main avec delai de fabrication de 1-2 semaines.

---

## 2. Stack Technique

```
FRONTEND                          API                           BASE DE DONNEES
React 19 + Vite 7                 Express 4 + Node.js           Supabase (PostgreSQL)
React Router 7                    Stripe SDK                    Row Level Security (RLS)
i18next                           Resend (emails)               Supabase Storage (images)
Lucide React (icones)             multer (uploads)              Supabase Auth
Stripe Elements                   Supabase Admin Client
```

| Brique | Technologie | Hebergement |
|--------|------------|-------------|
| Frontend | React 19, Vite 7, React Router 7 | Netlify |
| Backend | Express 4, Node.js | Render |
| Base de donnees | Supabase (PostgreSQL) | Supabase Cloud |
| Paiement | Stripe (PaymentIntent) | Stripe |
| Emails | Resend API | Resend |
| Stockage images | Supabase Storage (bucket `product-images`) | Supabase Cloud |
| Authentification | Supabase Auth (email/password) | Supabase Cloud |

---

## 3. Architecture Globale

```
E-Commerce/
  client/          # Frontend React (Vite) - interface utilisateur et admin
  api/             # Backend Express - Stripe, contact, cleanup
  Database/        # SQL : schema, RLS, migrations, seeds
  Docs/            # Documentation technique
  .opencode/       # Instructions pour les agents IA
```

### Separation des responsabilites

- **Client** : tout le rendu UI, le routage, l'etat (Context API), les appels Supabase via la couche services.
- **API** : uniquement les operations qui necessitent un secret serveur (Stripe, envoi d'emails via Resend, nettoyage de commandes).
- **Supabase** : base de donnees, authentification, stockage fichiers, securite via RLS.

---

## 4. Cote Utilisateur

### 4.1 Pages et Routes

| Route | Page | Protection | Description |
|-------|------|-----------|-------------|
| `/` | `Home` | Public | Page d'accueil : hero carousel, produits vedettes, section "confiance" |
| `/items` | `ProductList` | Public | Catalogue avec filtres (categorie, couleur, prix, recherche texte) |
| `/item/:id` | `ProductDetail` | Public | Fiche produit : images, description, selection variante/couleur, avis clients |
| `/cart` | `Cart` | Public | Panier d'achat avec gestion des quantites |
| `/login` | `Login` | Public | Connexion |
| `/signup` | `AuthForm` | Public | Inscription |
| `/checkout` | `Stripe` | Authentifie | Paiement Stripe Elements |
| `/orders` | `MyOrders` | Authentifie | Historique des commandes du client |
| `/profile` | `Profile` | Authentifie | Profil utilisateur (infos personnelles) |
| `/payment-success` | `PaymentSuccess` | Authentifie | Confirmation apres paiement reussi |
| `/photos` | `CustomerPhotos` | Public | Page galerie photos clients |

### 4.2 Flux d'Achat Complet

```
1. CATALOGUE
   L'utilisateur parcourt les produits via ProductList.
   Filtres disponibles : categorie, couleur, fourchette de prix, recherche texte.
   Les produits sont charges via fetchItemsWithRelations() depuis Supabase.

2. FICHE PRODUIT
   Selection d'une variante (taille) et d'une couleur.
   Affichage du prix, stock, images (galerie), avis clients.
   Produits similaires suggeres en bas de page.

3. PANIER
   Ajout via CartContext.addItem().
   Le panier est persiste dans localStorage (cle par variantId).
   Gestion des quantites, verification du stock local.

4. CHECKOUT
   Le client doit etre authentifie.
   POST /api/checkout cree la commande (status: pending) et le PaymentIntent Stripe.
   Le client saisit sa carte et son adresse de livraison.

5. PAIEMENT
   Stripe traite le paiement (3D Secure si necessaire).
   Le webhook Stripe (POST /api/stripe/webhook) met a jour le statut :
     - payment_intent.succeeded -> commande "paid"
     - payment_intent.payment_failed -> commande "failed"

6. CONFIRMATION
   Redirection vers PaymentSuccess.
   Le panier est vide.
   La commande apparait dans MyOrders.
```

### 4.3 Panier (CartContext)

- Persiste dans `localStorage`.
- Chaque ligne est identifiee par `variantId` (pas par produit).
- Structure d'un item :

```javascript
{
  id,              // ID du produit
  variantId,       // ID de la variante selectionnee
  name,            // Nom du produit
  unit_price,      // Prix unitaire
  quantity,        // Quantite
  size,            // Taille de la variante
  color,           // Nom de la couleur
  color_hex,       // Code hex
  stock,           // Stock disponible
  image_url        // URL de l'image
}
```

### 4.4 Authentification Utilisateur

- Supabase Auth (email + mot de passe uniquement, pas d'OAuth).
- `AuthContext` ecoute `onAuthStateChange` et recupere/cree le profil dans la table `users`.
- Roles : `client` (par defaut) et `admin`.
- `PrivateRoute` protege les routes avec un prop `role` optionnel.
- Les RLS Supabase renforcent la securite au niveau donnees.

### 4.5 Avis et Notes

- Un utilisateur peut laisser **un seul avis** par produit (1-5 etoiles + commentaire).
- Les avis sont publics en lecture.
- Seul l'auteur peut modifier/supprimer son propre avis.

### 4.6 Mobile

- Detection via le hook `useIsMobile()`.
- Composant `MobileHome` dedie avec un layout optimise.
- Feature flags dans `config/features.js` pour le test A/B de la page d'accueil mobile.
- Composants mobiles specifiques : `TrustChips`, `ProductScroller`, `Accordion`.

### 4.7 Theme

- Theme clair/sombre via `ThemeContext`.
- Persiste dans `localStorage`.
- Bascule via `toggleTheme()`.

---

## 5. Cote Admin

### 5.1 Acces

- Routes sous `/admin/*`, protegees par `PrivateRoute` avec `role="admin"`.
- Layout dedie (`AdminLayout.jsx`) avec sidebar de navigation et zone de contenu (`<Outlet />`).

### 5.2 Pages Admin

| Route | Page | Description |
|-------|------|-------------|
| `/admin` | `AdminDashboard` | Tableau de bord avec KPIs (revenu, commandes, panier moyen, commandes en attente) |
| `/admin/products` | `AdminProducts` | Gestion des produits via ProductManager |
| `/admin/variants` | `AdminVariants` | Gestion des variantes (taille, stock, prix, SKU) |
| `/admin/colors` | `AdminColors` | Gestion du referentiel de couleurs |
| `/admin/categories` | `AdminCategories` | Gestion des categories (hierarchie parent/enfant) |
| `/admin/orders` | `AdminOrders` | Gestion des commandes (consultation, changement de statut) |
| `/admin/users` | `AdminUsers` | Gestion des utilisateurs (consultation, roles) |
| `/admin/photos` | `AdminCustomerPhotos` | Gestion des photos clients |

### 5.3 Gestion des Produits (Wizard Multi-Etapes)

La creation/edition d'un produit suit un wizard en 4 etapes :

```
Etape 1 : INFO (InfoStep.jsx)
  - Nom, description, prix de base, categorie, statut, type de motif
  - Champs obligatoires : nom, prix

Etape 2 : VARIANTES (VariantsStep.jsx)
  - Ajout de variantes : taille, prix, stock, SKU
  - Au moins une variante requise

Etape 3 : COULEURS (ColorsStep.jsx)
  - Selection des couleurs depuis le referentiel
  - Au moins une couleur requise

Etape 4 : IMAGES (ImagesStep.jsx)
  - Upload d'images vers Supabase Storage
  - Drag & drop pour reordonner (DraggableImageGrid)
  - Premiere image = image principale

Etape 5 : RECAPITULATIF (ReviewStep.jsx)
  - Resume de toutes les informations avant validation
```

- Le brouillon est sauvegarde automatiquement dans `localStorage`.
- Le hook `useUnsavedChanges` previent la perte de donnees a la navigation.
- Le hook `useProductForm` gere tout l'etat du wizard.

### 5.4 Services Admin

Chaque section admin a son propre fichier de service :

| Service | Fichier | Fonctions principales |
|---------|---------|----------------------|
| Produits | `adminProducts.js` | `listProducts`, `upsertItem`, `createItemWithColors`, `syncItemColors`, `deleteProduct` |
| Categories | `adminCategories.js` | `listCategories`, `createCategory`, `updateCategory`, `deleteCategory` |
| Couleurs | `adminColors.js` | `listColors`, `createColor`, `updateColor`, `deleteColor` |
| Commandes | `adminOrders.js` | `listOrders`, `updateOrderStatus` |
| Utilisateurs | `adminUsers.js` | `listUsers`, `updateUserRole` |
| Variantes | `adminVariants.js` | `listVariants`, `createVariant`, `updateVariant`, `deleteVariant` |
| Photos clients | `adminCustomerPhotos.js` | `listAllPhotos`, `uploadPhoto`, `deletePhoto`, `toggleVisibility`, `reorderPhotos` |

### 5.5 Dashboard KPIs

Le hook `useAdminStats` fournit :
- **Revenu total** (commandes payees, mois en cours)
- **Variation revenu** (% par rapport au mois precedent)
- **Nombre de commandes** (mois en cours)
- **Variation commandes** (% par rapport au mois precedent)
- **Panier moyen**
- **Commandes en attente**

---

## 6. Base de Donnees

### 6.1 Schema (12 tables)

```
CATALOGUE                    COMMANDES                    PAIEMENTS
  categories                   orders                       payments
    id, name, parent_id         id (uuid), user_id           id, order_id
                                status, total                stripe_payment_intent_id
  items                         currency, shipping_address   amount, currency, status
    id, name, description       payment_intent_id
    price, image_url                                       stripe_events
    category_id, status        order_items                    id, event_id, event_type
    pattern_type                 id, order_id
                                 item_id, variant_id        UTILISATEURS
  item_variants                  quantity, unit_price         users
    id, item_id, sku                                           id (uuid), email, role
    size, stock, price
                               AVIS
  item_images                    item_ratings
    id, item_id, image_url       id, item_id, user_id
    position                     rating, comment

  item_colors
    item_id, color_id

  colors
    id, name, hex_code

  GALERIE
  customer_photos
    id, image_url, position
    is_visible, created_at
```

### 6.2 Relations Cles

- Un **produit** (`items`) appartient a une **categorie** (`categories`).
- Les categories sont **hierarchiques** (auto-reference via `parent_id`).
- Un produit a **plusieurs variantes** (`item_variants`) : chaque variante = une taille avec son propre prix et stock.
- Un produit est associe a **plusieurs couleurs** via la table de jointure `item_colors`.
- Les **couleurs** proviennent du referentiel `colors` (nom + code hex).
- Un produit a **plusieurs images** (`item_images`) avec un champ `position` pour l'ordre.
- Une **commande** (`orders`) appartient a un **utilisateur** et contient **plusieurs lignes** (`order_items`).
- Chaque ligne de commande pointe vers une **variante** specifique.
- Un **paiement** (`payments`) est rattache a une **commande** via `payment_intent_id`.

### 6.3 Statuts de Commande

```
pending -> paid -> shipped -> (delivered)
       \-> failed
       \-> canceled
       \-> refunded
```

### 6.4 Row Level Security (RLS)

| Table | Lecture | Ecriture | Modification | Suppression |
|-------|---------|----------|-------------|-------------|
| `users` | Propre profil + admin | Propre profil | Propre profil + admin | Admin |
| `items` | Public | Admin | Admin | Admin |
| `item_variants` | Public | Admin | Admin | Admin |
| `item_images` | Public | Admin | Admin | Admin |
| `colors` | Public | Admin | Admin | Admin |
| `categories` | Public | Admin | Admin | Admin |
| `item_colors` | Public | Admin | Admin | Admin |
| `orders` | Propres commandes + admin | Propre utilisateur | Admin | Admin |
| `order_items` | Via la commande | Via la commande | Admin | Admin |
| `payments` | Admin | Admin | Admin | Admin |
| `stripe_events` | Admin | Admin | Admin | Admin |
| `item_ratings` | Public | Propre avis | Propre avis | Propre avis |
| `customer_photos` | Public (visible) | Admin | Admin | Admin |

Fonction helper :
```sql
is_admin(uid uuid) -- Retourne true si l'utilisateur a le role 'admin'
```

### 6.5 Stockage des Images

- Bucket Supabase Storage : `product-images`.
- Lecture publique (pour afficher les images sur le site).
- Ecriture reservee aux admins.
- Upload via multer (backend) ou directement via le client Supabase (admin).

---

## 7. API Backend

### 7.1 Endpoints

| Methode | Route | Description | Auth |
|---------|-------|-------------|------|
| `GET` | `/api/health` | Health check | Non |
| `POST` | `/api/checkout` | Cree une commande + PaymentIntent Stripe | Bearer token |
| `POST` | `/api/stripe/webhook` | Webhook Stripe (payment events) | Signature Stripe |
| `POST` | `/api/contact` | Formulaire de contact (envoi email via Resend) | Non |
| `POST` | `/api/admin/cleanup-orders` | Supprime les commandes pending > 24h | Admin |

### 7.2 Flux Checkout Detail

```
1. Le client envoie : { currency, cartItems, customerEmail }
   avec le header Authorization: Bearer <supabase_access_token>

2. Le serveur :
   a. Valide le token Supabase (auth.getUser)
   b. Normalise le panier
   c. Verifie les stocks et les prix en base
   d. Cree la commande (status: pending) + les order_items
   e. Cree un PaymentIntent Stripe
   f. Retourne { clientSecret, orderId }

3. Le client utilise clientSecret pour confirmer le paiement via Stripe Elements.

4. Stripe envoie un webhook :
   - payment_intent.succeeded -> commande passe a "paid"
   - payment_intent.payment_failed -> commande passe a "failed"
```

### 7.3 Nettoyage Automatique

- Les commandes en statut `pending` depuis plus de 24h sont supprimees automatiquement.
- Se declenche au demarrage du serveur + toutes les 6 heures.

---

## 8. Internationalisation (i18n)

- Bibliotheque : `i18next` + `react-i18next`.
- Langue par defaut : **allemand** (`de`).
- Langue secondaire : **francais** (`fr`).
- Fichiers de traduction : `client/src/locales/{de,fr}/translation.json`.
- Tout texte visible dans l'UI doit passer par `t('cle')`.
- Structure hierarchique des cles : `section.sous_section.element` (ex: `home.hero.title`).

---

## 9. Deploiement

| Service | Plateforme | Configuration |
|---------|-----------|--------------|
| Frontend | Netlify | Build depuis `client/`, config dans `netlify.toml` |
| API | Render | Node.js, `api/src/server.js` |
| Base de donnees | Supabase Cloud | PostgreSQL manage |
| DNS/Domaine | A definir | - |

### Variables d'Environnement

**Client** (`client/.env`) :
- `VITE_SUPABASE_URL` - URL du projet Supabase
- `VITE_SUPABASE_ANON_KEY` - Cle anonyme Supabase
- `VITE_STRIPE_PUBLISHABLE_KEY` - Cle publique Stripe
- `VITE_API_URL` - URL de l'API backend

**API** (`api/.env`) :
- `PORT` - Port du serveur (defaut: 3000)
- `CLIENT_ORIGIN` - Origine du client (CORS)
- `STRIPE_SECRET_KEY` - Cle secrete Stripe
- `STRIPE_WEBHOOK_SECRET` - Secret du webhook Stripe
- `SUPABASE_URL` - URL du projet Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Cle service role Supabase
- `RESEND_API_KEY` - Cle API Resend (emails)

---

## 10. Etat Actuel et Points d'Attention

### Ce qui fonctionne
- Catalogue complet avec filtres et recherche
- Fiche produit avec variantes, couleurs, images, avis
- Panier avec persistance localStorage
- Checkout Stripe avec webhooks
- Panel admin complet (produits, commandes, utilisateurs, etc.)
- Internationalisation DE/FR
- Theme clair/sombre
- Layout mobile dedie

### Ce qui manque
- **Tests** : aucun test unitaire ou d'integration n'existe.
- **TypeScript** : le projet est en JavaScript pur.
- **Pages legales** : Privacy Policy, Impressum, AGB, Widerruf.
- **Delai de fabrication** : info a rendre visible (home, fiche produit, checkout).

### Backlog Prioritaire
1. Pages legales (Impressum, AGB, Privacy Policy, Widerruf)
2. Ameliorations UX mobile (galerie swipe, selecteur couleurs)
3. Bloc "produits disponibles immediatement" sur la home
4. Info delai de fabrication visible
5. Catalogue regroupe par categories ("See Kollektion")
