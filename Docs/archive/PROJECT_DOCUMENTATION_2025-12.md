# 📚 Documentation du Projet E-Commerce Sabbels Handmade

**Version :** 0.1.0
**Dernière mise à jour :** 21 décembre 2025
**Stack technique :** React 19, Vite 7, Express, Supabase, Stripe

---

## 📖 Table des Matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture du projet](#2-architecture-du-projet)
3. [Installation et configuration](#3-installation-et-configuration)
4. [Client (Frontend)](#4-client-frontend)
5. [API (Backend)](#5-api-backend)
6. [Base de données](#6-base-de-données)
7. [Flux de données](#7-flux-de-données)
8. [Backlog & priorités](#8-backlog--priorités)
9. [Guide de contribution](#9-guide-de-contribution)

---

## 1. Vue d'ensemble

### 1.1 Description du Projet

**Sabbels Handmade** est une plateforme e-commerce B2C pour la vente de produits artisanaux faits main (paniers, organisateurs, accessoires textile). Le projet cible principalement les marchés allemand et français.

### 1.2 Fonctionnalités Principales

| Module               | Fonctionnalités                                                                      |
| -------------------- | ------------------------------------------------------------------------------------ |
| **Catalogue**        | Liste produits, filtres (catégorie, couleur, prix), recherche, détail produit        |
| **Panier**           | Ajout/suppression, gestion quantités, persistance localStorage                       |
| **Paiement**         | Checkout Stripe, webhooks, gestion statuts commande                                  |
| **Authentification** | Inscription, connexion, gestion session via Supabase Auth                            |
| **Admin**            | Dashboard KPIs, gestion produits/variants/couleurs/catégories/commandes/utilisateurs |
| **i18n**             | Support multilingue (Allemand, Français)                                             |

### 1.3 Stack Technique

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                  │
│  React 19 + Vite 7 + React Router 7 + i18next                   │
│  Hébergé sur Netlify                                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API                                      │
│  Express 4 + Node.js                                            │
│  Stripe SDK + Supabase Admin Client                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE DE DONNÉES                             │
│  Supabase (PostgreSQL) + Row Level Security                     │
│  Storage pour images                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Architecture du Projet

### 2.1 Structure des Dossiers

```
E-Commerce/
├── api/                        # Backend Express
│   ├── src/
│   │   └── server.js           # Point d'entrée serveur
│   └── package.json
│
├── client/                     # Frontend React
│   ├── public/                 # Assets statiques
│   ├── src/
│   │   ├── api/                # Fonctions API legacy (à migrer)
│   │   ├── assets/             # Images, fonts
│   │   ├── components/         # Composants réutilisables
│   │   │   └── Admin/          # Composants admin (managers)
│   │   ├── context/            # React Contexts (état global)
│   │   ├── hooks/              # Hooks personnalisés
│   │   ├── locales/            # Fichiers de traduction
│   │   │   ├── de/             # Allemand
│   │   │   └── fr/             # Français
│   │   ├── pages/              # Composants de pages
│   │   ├── services/           # Abstraction appels Supabase
│   │   ├── styles/             # Fichiers CSS
│   │   ├── supabase/           # Configuration client Supabase
│   │   ├── App.jsx             # Routes et layout principal
│   │   ├── i18n.js             # Configuration i18next
│   │   └── main.jsx            # Point d'entrée React
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── Database/                   # Scripts SQL Supabase
│   ├── BDD_struct.sql          # Schéma tables
│   ├── RLS.sql                 # Politiques Row Level Security
│   ├── SEED.sql                # Données de test
│   └── delete_BDD.sql          # Suppression tables
│
├── Docs/                       # Documentation
│   ├── API.md
│   ├── Architecture.md
│   └── ...
│
├── Server/                     # Scripts utilitaires
│   └── Stripe.js
│
├── netlify.toml                # Configuration déploiement
└── package.json                # Dépendances racine
```

### 2.2 Conventions de Nommage

| Type             | Convention                | Exemple              |
| ---------------- | ------------------------- | -------------------- |
| Composants React | PascalCase                | `ProductManager.jsx` |
| Pages            | PascalCase                | `AdminDashboard.jsx` |
| Services         | camelCase                 | `adminProducts.js`   |
| Hooks            | camelCase + préfixe `use` | `useAdminStats.js`   |
| Styles           | kebab-case ou PascalCase  | `ProductList.css`    |
| Tables SQL       | snake_case                | `item_variants`      |

---

## 3. Installation et Configuration

### 3.1 Prérequis

- **Node.js** v20+ (recommandé v22)
- **npm** v10+
- Compte **Supabase** (gratuit)
- Compte **Stripe** (mode test)

### 3.2 Variables d'Environnement

#### Client (`client/.env.local`)

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_API_URL=http://localhost:3000
```

#### API (`api/.env`)

```env
PORT=3000
CLIENT_ORIGIN=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3.3 Installation

```bash
# 1. Cloner le repo
git clone <repo-url>
cd E-Commerce

# 2. Installer les dépendances client
cd client
npm install

# 3. Installer les dépendances API
cd ../api
npm install

# 4. Configurer la base de données
# → Exécuter Database/BDD_struct.sql dans Supabase SQL Editor
# → Exécuter Database/RLS.sql
# → (Optionnel) Exécuter Database/SEED.sql pour données test

# 5. Démarrer en développement
# Terminal 1 - Client
cd client && npm run dev

# Terminal 2 - API
cd api && npm run dev
```

---

## 4. Client (Frontend)

### 4.1 Point d'Entrée et Providers

#### `main.jsx`

Point d'entrée React qui configure tous les providers :

```jsx
<I18nextProvider i18n={i18n}>
  {" "}
  {/* Traductions */}
  <ErrorBoundary>
    {" "}
    {/* Capture erreurs */}
    <BrowserRouter>
      {" "}
      {/* Routing */}
      <ThemeProvider>
        {" "}
        {/* Thème clair/sombre */}
        <AuthProvider>
          {" "}
          {/* Session utilisateur */}
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </ErrorBoundary>
</I18nextProvider>
```

### 4.2 Routing (`App.jsx`)

| Route       | Composant       | Protection  |
| ----------- | --------------- | ----------- |
| `/`         | `Home`          | Public      |
| `/items`    | `ProductList`   | Public      |
| `/item/:id` | `ProductDetail` | Public      |
| `/cart`     | `Cart`          | Public      |
| `/login`    | `Login`         | Public      |
| `/signup`   | `AuthForm`      | Public      |
| `/checkout` | `Stripe`        | Authentifié |
| `/orders`   | `MyOrders`      | Authentifié |
| `/profile`  | `Profile`       | Authentifié |
| `/admin/*`  | `AdminLayout`   | Admin only  |

Le composant `ScrollToTop` force un retour en haut de page à chaque changement de route pour éviter les scrolls résiduels lors des navigations. 

### 4.3 Contexts (État Global)

#### `AuthContext.jsx`

Gère l'authentification utilisateur via Supabase Auth.

```jsx
// Valeurs exposées
{
  session, // Session Supabase (contient access_token)
    userData, // Profil utilisateur {id, email, role}
    loading, // État de chargement initial
    authError; // Erreur d'authentification
}
```

**Flux d'authentification :**

1. Au montage, récupère la session existante
2. Écoute les changements d'état auth (`onAuthStateChange`)
3. Récupère/crée le profil dans la table `users`

#### `CartContext.jsx`

Gère le panier avec persistance localStorage.

```jsx
// Valeurs exposées
{
  cart, // Array des items [{variantId, name, quantity, ...}]
    cartItems, // Alias de cart
    addItem, // (payload) => void - Ajoute un item
    removeItem, // (item) => void - Supprime complètement
    decreaseItem, // (item) => void - Décrémente quantité
    clearCart; // () => void - Vide le panier
}
```

**Structure d'un item panier :**

```javascript
{
  id: number,           // ID du produit
  itemId: number,       // Alias
  variantId: number,    // ID du variant sélectionné
  variant_id: number,   // Alias snake_case
  name: string,         // Nom du produit
  unit_price: number,   // Prix unitaire
  quantity: number,     // Quantité
  size: string,         // Taille du variant
  color: string,        // Nom couleur
  color_hex: string,    // Code hex couleur
  stock: number|null,   // Stock disponible
  image_url: string     // URL image
}
```

#### `ThemeContext.jsx`

Gère le thème clair/sombre avec persistance localStorage.

```jsx
// Valeurs exposées
{
  theme, // 'light' | 'dark'
    setTheme, // (theme) => void
    toggleTheme; // () => void
}
```

### 4.4 Services (Abstraction API)

Les services encapsulent les appels Supabase pour une meilleure maintenabilité.

#### `services/items.js`

```javascript
// Fonctions principales
fetchLatestItems(limit); // Derniers produits ajoutés
fetchTopItems(limit); // Produits populaires
fetchItemsWithRelations(); // Tous les produits avec relations
fetchCategories(); // Liste des catégories
fetchItemDetail(id); // Détail d'un produit
fetchRelatedItems(catId, excludeId); // Produits similaires
fetchItemRatings(ids); // Notes moyennes
```

#### `services/auth.js`

```javascript
signOut(); // Déconnexion
fetchUserProfile(userId); // Récupère profil utilisateur
```

#### `services/adminProducts.js`

```javascript
listProducts()               // Liste admin des produits
listCategories()             // Catégories avec parents
fetchVariantsByItem(itemId)  // Variants d'un produit
upsertItem(payload, id?)     // Créer/modifier produit
createItemWithColors(payload, colorIds)  // Créer avec couleurs
syncItemColors(itemId, colorIds)         // Synchroniser couleurs
// ... autres fonctions CRUD
```

#### `services/adminOrders.js`

```javascript
listOrders(); // Toutes les commandes
updateOrderStatus(id, status); // Modifier statut
```

### 4.5 Composants Principaux

#### Pages

| Fichier              | Description                                 | Props/Paramètres                         |
| -------------------- | ------------------------------------------- | ---------------------------------------- |
| `Home.jsx`           | Page d'accueil avec hero, produits vedettes | -                                        |
| `ProductList.jsx`    | Catalogue avec filtres                      | Query params: `?search=`, `?categoryId=` |
| `ProductDetail.jsx`  | Détail produit, sélection variant, avis     | URL param: `:id`                         |
| `Cart.jsx`           | Panier d'achat                              | -                                        |
| `Login.jsx`          | Formulaire connexion                        | `onSuccess?: callback`                   |
| `AuthForm.jsx`       | Formulaire inscription                      | `onSuccess?: callback`                   |
| `Profile.jsx`        | Profil utilisateur                          | -                                        |
| `MyOrders.jsx`       | Historique commandes client                 | -                                        |
| `PaymentSuccess.jsx` | Confirmation paiement                       | Query: `?payment_intent_client_secret=`  |

#### Pages Admin

| Fichier               | Description                    |
| --------------------- | ------------------------------ |
| `AdminLayout.jsx`     | Layout avec sidebar navigation |
| `AdminDashboard.jsx`  | KPIs et raccourcis             |
| `AdminProducts.jsx`   | Wrapper pour ProductManager    |
| `AdminVariants.jsx`   | Gestion variants               |
| `AdminColors.jsx`     | Gestion couleurs               |
| `AdminCategories.jsx` | Gestion catégories             |
| `AdminOrders.jsx`     | Gestion commandes              |
| `AdminUsers.jsx`      | Gestion utilisateurs           |

#### Composants Réutilisables

| Fichier              | Description                | Props                                            |
| -------------------- | -------------------------- | ------------------------------------------------ |
| `Navbar.jsx`         | Navigation principale      | -                                                |
| `Footer.jsx`         | Pied de page               | -                                                |
| `ItemCard.jsx`       | Carte produit catalogue    | `item`, `avgRating?`, `reviewCount?`             |
| `MiniItemCard.jsx`   | Carte produit compacte     | `item`                                           |
| `ProductFilters.jsx` | Sidebar filtres            | `categories`, `colors`, `selectedCategory`, etc. |
| `StatusMessage.jsx`  | Messages loading/error     | `LoadingMessage`, `ErrorMessage`                 |
| `PrivateRoute.jsx`   | Route protégée             | `children`, `role?`                              |
| `CheckoutForm.jsx`   | Formulaire paiement Stripe | `onSuccess?`                                     |
| `Stripe.jsx`         | Wrapper Stripe Elements    | -                                                |
| `ColorPicker.jsx`    | Sélecteur couleurs swatches + recherche | `colors`, `selectedColor`, `onChange`   |
| `ScrollToTop.jsx`    | Remise à zéro du scroll à chaque route | -                                     |
| `ToastHost.jsx`      | Conteneur notifications    | -                                                |
| `ErrorBoundary.jsx`  | Capture erreurs React      | `children`, `fallback?`                          |

### 4.6 Hooks Personnalisés

#### `useAdminStats.js`

Hook pour les KPIs du dashboard admin.

```javascript
const stats = useAdminStats();
// Retourne:
{
  loading: boolean,
  error: string|null,
  revenue: string,        // Formaté en EUR
  revenueDeltaPct: number|null,
  orders: number,
  ordersDeltaPct: number|null,
  avgOrder: string,       // Formaté en EUR
  pendingOrders: number
}
```

#### `useUnsavedChanges.js`

Hook pour prévenir la perte de données lors de navigation.

```javascript
useUnsavedChanges(isDirty, message?);
// Affiche une confirmation avant de quitter la page si isDirty=true
```

### 4.7 Internationalisation

Configuration dans `i18n.js` avec support FR/DE.

**Structure des fichiers de traduction :**

```
locales/
├── de/translation.json    # Allemand (langue par défaut)
└── fr/translation.json    # Français
```

**Utilisation :**

```jsx
import { useTranslation } from "react-i18next";

function Component() {
  const { t, i18n } = useTranslation();

  return (
    <>
      <h1>{t("home.hero.title")}</h1>
      <button onClick={() => i18n.changeLanguage("fr")}>FR</button>
    </>
  );
}
```

---

## 5. API (Backend)

### 5.1 Architecture

Serveur Express minimaliste avec 3 endpoints principaux.

```javascript
// api/src/server.js
app.get("/api/health"); // Health check
app.post("/api/stripe/webhook"); // Webhook Stripe
app.post("/api/checkout"); // Création paiement
```

### 5.2 Endpoints

#### `GET /api/health`

Health check pour monitoring.

**Réponse :**

```json
{ "ok": true }
```

#### `POST /api/checkout`

Crée une commande et un PaymentIntent Stripe.

**Headers :**

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

**Body :**

```json
{
  "currency": "eur",
  "cartItems": [{ "item_id": 1, "quantity": 2, "variant_id": 5 }],
  "customerEmail": "client@example.com"
}
```

**Réponse succès (200) :**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "orderId": "uuid-xxx"
}
```

**Erreurs possibles :**

- `401` - Non authentifié
- `400` - Panier vide, variant manquant, stock insuffisant
- `500` - Erreur serveur

**Flux de traitement :**

1. Authentification via token Supabase
2. Normalisation et validation du panier
3. Vérification stocks et calcul total
4. Création commande en statut `pending`
5. Création PaymentIntent Stripe
6. Retour clientSecret au frontend

#### `POST /api/stripe/webhook`

Réception des événements Stripe.

**Headers :**

```
stripe-signature: t=xxx,v1=xxx
Content-Type: application/json (raw)
```

**Événements gérés :**

- `payment_intent.succeeded` → Commande `paid`
- `payment_intent.payment_failed` → Commande `failed`

### 5.3 Fonctions Utilitaires

```javascript
// Authentification
getUserFromAuthHeader(authHeader); // Valide token et retourne user

// Panier
normalizeCartItems(rawItems); // Normalise format panier
gatherCartPricing(cartItems); // Calcule total avec vérif prix
```

---

## 6. Base de Données

### 6.1 Schéma Entité-Relation

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │     │   categories │     │    colors    │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (uuid) PK │     │ id PK        │     │ id PK        │
│ email        │     │ name         │     │ name         │
│ role         │     │ parent_id FK │────▶│ code         │
└──────────────┘     └──────────────┘     │ hex_code     │
       │                    │              └──────────────┘
       │                    │                     │
       ▼                    ▼                     │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    orders    │     │    items     │◀────│ item_colors  │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id (uuid) PK │     │ id PK        │     │ item_id FK   │
│ user_id FK   │────▶│ name         │     │ color_id FK  │
│ status       │     │ description  │     └──────────────┘
│ total        │     │ price        │
│ currency     │     │ category_id  │────▶
└──────────────┘     │ status       │     ┌──────────────┐
       │             └──────────────┘     │ item_images  │
       │                    │             ├──────────────┤
       ▼                    │             │ id PK        │
┌──────────────┐            │             │ item_id FK   │
│ order_items  │            │             │ image_url    │
├──────────────┤            │             └──────────────┘
│ id PK        │            │
│ order_id FK  │            ▼
│ item_id FK   │     ┌──────────────┐
│ variant_id FK│────▶│item_variants │
│ quantity     │     ├──────────────┤
│ unit_price   │     │ id PK        │
└──────────────┘     │ item_id FK   │
                     │ sku          │
                     │ size         │
                     │ stock        │
                     │ price        │
                     └──────────────┘
```

### 6.2 Tables Principales

#### `users`

```sql
id          UUID PRIMARY KEY  -- Référence auth.users
email       TEXT NOT NULL UNIQUE
role        TEXT DEFAULT 'client' CHECK (role IN ('client','admin'))
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

#### `items` (Produits)

```sql
id           BIGSERIAL PRIMARY KEY
name         TEXT NOT NULL
description  TEXT
price        NUMERIC(10,2) NOT NULL CHECK (price >= 0)
image_url    TEXT              -- Image principale (legacy)
category_id  BIGINT REFERENCES categories(id)
status       TEXT DEFAULT 'draft' CHECK (status IN ('draft','active','archived'))
pattern_type TEXT              -- Style de crochet: 'rechtsmuster' | 'gaensefuesschen' | NULL
created_at   TIMESTAMP
updated_at   TIMESTAMP
```

#### `item_variants`

```sql
id         BIGSERIAL PRIMARY KEY
item_id    BIGINT NOT NULL REFERENCES items(id)
sku        TEXT UNIQUE           -- Stock Keeping Unit
size       TEXT                  -- XS, S, M, L, XL, XXL, Unique
stock      INTEGER DEFAULT 0 CHECK (stock >= 0)
price      NUMERIC(10,2) NOT NULL
created_at TIMESTAMP
```

#### `orders`

```sql
id                 UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id            UUID NOT NULL REFERENCES users(id)
status             TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending','paid','failed','canceled','shipped','refunded'))
currency           TEXT DEFAULT 'eur'
total              NUMERIC(10,2) DEFAULT 0
shipping_address   JSONB
payment_intent_id  TEXT UNIQUE
created_at         TIMESTAMP
updated_at         TIMESTAMP
```

### 6.3 Row Level Security (RLS)

Toutes les tables ont RLS activé. Règles principales :

| Table         | SELECT      | INSERT      | UPDATE      | DELETE     |
| ------------- | ----------- | ----------- | ----------- | ---------- |
| users         | Own + Admin | Own + Admin | Own + Admin | Admin only |
| items         | Public      | Admin       | Admin       | Admin      |
| item_variants | Public      | Admin       | Admin       | Admin      |
| colors        | Public      | Admin       | Admin       | Admin      |
| orders        | Own + Admin | Own + Admin | Admin       | Admin      |
| order_items   | Via order   | Via order   | Admin       | Admin      |

**Fonction helper :**

```sql
CREATE FUNCTION is_admin(uid uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM users u WHERE u.id = uid AND u.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

---

## 7. Flux de Données

### 7.1 Flux d'Achat Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. NAVIGATION CATALOGUE                                         │
│    ProductList → fetchItemsWithRelations() → Supabase           │
│    Filtres locaux (catégorie, couleur, prix)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. SÉLECTION PRODUIT                                            │
│    ProductDetail → fetchItemDetail(id) → Supabase               │
│    Sélection variant (taille) + couleur + quantité              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. AJOUT AU PANIER                                              │
│    CartContext.addItem() → setState() → localStorage            │
│    Vérification stock local                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. CHECKOUT                                                     │
│    Stripe.jsx → POST /api/checkout                              │
│    - Validation serveur (auth, stock, prix)                     │
│    - Création order (pending)                                   │
│    - Création PaymentIntent                                     │
│    - Retour clientSecret                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. PAIEMENT                                                     │
│    CheckoutForm → stripe.confirmPayment()                       │
│    Saisie carte + adresse livraison                             │
│    Redirect vers Stripe si 3D Secure                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. WEBHOOK STRIPE                                               │
│    POST /api/stripe/webhook                                     │
│    - payment_intent.succeeded → order.status = 'paid'           │
│    - payment_intent.failed → order.status = 'failed'            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. CONFIRMATION                                                 │
│    PaymentSuccess → Affichage confirmation                      │
│    CartContext.clearCart()                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Flux Authentification

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   AuthForm.jsx   │     │  Supabase Auth   │     │   users table    │
│   (signup)       │────▶│  signUp()        │────▶│   upsert profile │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ AuthContext      │
                         │ onAuthStateChange│
                         │ fetchUserData()  │
                         └──────────────────┘
```

---

## 8. Backlog & priorités

Liste de tâches actionnables pour finaliser le site, avec dépendances explicites.

### 8.1 Contenu & médias

- Remplacer les images des catégories (images fournies via WhatsApp le 05/01).
- Ajouter “Pflegehinweise” (care instructions) dans une section dédiée et/ou sur chaque fiche produit selon le modèle retenu.
- Créer la page “Unsere Produkte bei euch zu Hause” (photos clients) :
  - Ajouter la page + intégration au menu/footer.
  - Prévoir une grille responsive avec lightbox (clic pour agrandir).

### 8.2 UX / Mobile (priorité haute)

- Rendre le sélecteur de couleurs cliquable et accessible (chips/swatches).
  - Gérer l’affichage complet (scroll horizontal, wrap, ou “+X” si trop de couleurs).
- ✅ Implémenté : swatches cliquables avec bouton “+X” et scroll horizontal sur mobile.
- Galerie mobile : première image visible + vraie galerie.
  - Sur mobile, afficher la première image comme visuel principal.
  - Ajouter une galerie swipe/carrousel pour les autres images.

### 8.3 Bugs & navigation

- Corriger le comportement de scroll au reload/navigation :
  - Forcer le scroll en haut à chaque navigation (sauf comportement “retour position” explicitement souhaité).
- ✅ Implémenté : reset du scroll à chaque changement de route via `ScrollToTop`.

### 8.4 Catalogue / Collections

- Bouton “See Kollektion” : afficher tous les produits, triés par catégories.
  - Garder l’affichage “tous les produits”.
  - Ajouter un regroupement/ordre par catégorie (titres de sections + listing).
  - Définir une logique claire d’ordre des catégories.

### 8.5 Pages légales & conformité

- Ajouter les pages :
  - Privacy Policy
  - Legal Notice / Impressum
  - Cancellation Policy / Widerruf
  - Terms & Conditions / AGB
- Intégrer les PDFs dès réception :
  - Liens en footer + éventuellement sur checkout.
  - Vérifier l’ouverture mobile + accessibilité.

### 8.6 Home (contenu marketing)

- Ajouter un bloc “customer pictures”.
- Ajouter un bloc “produits disponibles à acheter maintenant” (in-stock/ready-to-ship).
- Ajouter une info visible : délai de fabrication 1–2 semaines (home + idéalement fiche produit + checkout).

### 8.7 Dépendances & points bloquants

- Les éléments “je t’explique mieux quand tu y es” doivent être notés comme dépendances.
- Les pages légales impactent footer + checkout : à planifier proprement pour éviter les oublis.

## 9. Guide de Contribution

### 9.1 Workflow Git

```bash
# 1. Créer une branche depuis main
git checkout main
git pull origin main
git checkout -b feature/nom-feature

# 2. Développer avec commits atomiques
git add .
git commit -m "feat: description courte"

# 3. Pousser et créer PR
git push origin feature/nom-feature
# Créer Pull Request sur GitHub/GitLab
```

### 9.2 Conventions de Commit

Format : `type: description`

| Type       | Usage                                 |
| ---------- | ------------------------------------- |
| `feat`     | Nouvelle fonctionnalité               |
| `fix`      | Correction de bug                     |
| `docs`     | Documentation                         |
| `style`    | Formatage (pas de changement de code) |
| `refactor` | Refactorisation                       |
| `test`     | Ajout/modification tests              |
| `chore`    | Maintenance (dépendances, config)     |

### 9.3 Ajouter une Nouvelle Page

1. Créer le fichier dans `client/src/pages/NomPage.jsx`
2. Ajouter la route dans `App.jsx`
3. Créer le CSS dans `client/src/styles/nompage.css`
4. Ajouter les traductions dans `locales/de/translation.json` et `locales/fr/translation.json`

### 9.4 Ajouter un Nouveau Service

1. Créer le fichier dans `client/src/services/monService.js`
2. Importer Supabase client
3. Exporter des fonctions async qui retournent `{ data, error }`

```javascript
// Exemple
import { supabase } from "../supabase/supabaseClient";

export const fetchMaRessource = async params => {
  return supabase.from("ma_table").select("*").eq("colonne", params.valeur);
};
```

### 9.5 Modifier le Schéma BDD

1. Créer un fichier migration `Database/migrations/YYYYMMDD_description.sql`
2. Tester dans Supabase SQL Editor (environnement dev)
3. Mettre à jour `Database/BDD_struct.sql`
4. Mettre à jour `Database/RLS.sql` si nouvelles tables/policies

### 9.6 Checklist Avant PR

- [ ] Code testé localement (client + api)
- [ ] Pas d'erreurs ESLint (`npm run lint`)
- [ ] Traductions ajoutées (FR + DE)
- [ ] CSS responsive vérifié
- [ ] Pas de `console.log` en production
- [ ] Types/validation ajoutés si nouveau endpoint

### 9.7 Variables d'Environnement

**Ne jamais commiter de fichiers `.env` !**

Pour ajouter une nouvelle variable :

1. L'ajouter dans `.env.example`
2. La documenter dans ce fichier
3. L'ajouter dans la configuration du service de déploiement

---

## 📎 Ressources Utiles

- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation React Router](https://reactrouter.com/)
- [Documentation i18next](https://www.i18next.com/)
- [Documentation Vite](https://vitejs.dev/)

---

## 📞 Contact

Pour toute question technique, contacter l'équipe via :

- Email : contact@sabbels-handmade.com
- Issues GitHub du projet

---

_Documentation générée le 21 décembre 2025_
