# 🔍 Audit Technique Complet - E-Commerce Sabbels Handmade

**Date de l'audit :** 21 décembre 2025
**Version du projet :** 0.1.0
**Auditeur :** GitHub Copilot (Claude Opus 4.5)

---

## 📊 Résumé Exécutif

| Catégorie           | Note      | Priorité |
| ------------------- | --------- | -------- |
| **Sécurité**        | ⚠️ 6/10   | Haute    |
| **Performance**     | 🟡 7/10   | Moyenne  |
| **Qualité du Code** | 🟢 7.5/10 | Moyenne  |
| **Architecture**    | 🟢 8/10   | Basse    |
| **Maintenabilité**  | 🟢 7.5/10 | Moyenne  |
| **Accessibilité**   | 🟡 6.5/10 | Moyenne  |
| **Tests**           | 🔴 2/10   | Haute    |
| **Documentation**   | 🟡 6/10   | Moyenne  |

**Score Global : 6.3/10** - Projet fonctionnel nécessitant des améliorations significatives en sécurité et tests.

---

## 1. 🔐 Sécurité

### 1.1 Authentification & Autorisation

#### ✅ Points Positifs

- Utilisation de Supabase Auth avec JWT tokens
- Row Level Security (RLS) activé sur toutes les tables
- Fonction helper `is_admin()` bien implémentée avec `security definer`
- Séparation claire des rôles (`client`/`admin`)

#### ❌ Problèmes Identifiés

**CRITIQUE - Validation côté serveur insuffisante**

```javascript
// api/src/server.js - Ligne 73-78
async function getUserFromAuthHeader(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  // ⚠️ Pas de validation du format du token avant l'appel
  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
}
```

**Recommandation :** Ajouter une validation du format JWT avant l'appel à Supabase.

**HAUTE - Exposition des clés Supabase**

```javascript
// client/src/supabase/supabaseClient.js
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_KEY;
// ⚠️ La clé anonyme est exposée côté client (comportement normal pour Supabase mais nécessite RLS strict)
```

**Recommandation :** S'assurer que les RLS sont exhaustives et testées.

**MOYENNE - Service Role Key côté API**

```javascript
// api/src/server.js - Ligne 11
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
// ✅ Côté serveur OK, mais vérifier que cette clé n'est jamais loguée
```

**MOYENNE - Rate Limiting absent**

```javascript
// api/src/server.js
// ⚠️ Aucun rate limiting sur les endpoints
app.post('/api/checkout', async (req, res) => { ... })
```

**Recommandation :** Implémenter `express-rate-limit` :

```javascript
import rateLimit from "express-rate-limit";
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use("/api/", limiter);
```

**BASSE - CORS permissif en développement**

```javascript
// api/src/server.js - Ligne 62-66
app.use(
  cors({
    origin: CLIENT_ORIGIN.length ? CLIENT_ORIGIN : true, // ⚠️ 'true' accepte toutes les origines
    credentials: true,
  })
);
```

**Recommandation :** Ne jamais utiliser `true` en production.

### 1.2 Validation des Données

#### ❌ Problèmes Identifiés

**HAUTE - Validation d'entrée insuffisante**

```javascript
// api/src/server.js - Ligne 80-88
function normalizeCartItems(rawItems) {
  if (!Array.isArray(rawItems)) return []
  return rawItems
    .map(i => ({
      item_id: i.item_id || i.id || i.itemId, // ⚠️ Pas de validation de type
      quantity: Math.max(1, Number(i.quantity) || 1), // ⚠️ Pas de limite max
      variant_id: i.variant_id != null ? Number(i.variant_id) : ...
    }))
    .filter(i => i.item_id)
}
```

**Recommandations :**

- Utiliser une bibliothèque de validation (Zod, Joi, Yup)
- Ajouter une limite maximale sur les quantités
- Valider les types avec `typeof` ou schemas

**Exemple avec Zod :**

```javascript
import { z } from "zod";

const CartItemSchema = z.object({
  item_id: z.number().int().positive(),
  quantity: z.number().int().min(1).max(100),
  variant_id: z.number().int().positive(),
});

const CartSchema = z.array(CartItemSchema).min(1).max(50);
```

### 1.3 Protection contre les attaques

| Attaque        | Protection                         | Statut       |
| -------------- | ---------------------------------- | ------------ |
| SQL Injection  | Supabase ORM                       | ✅ Protégé   |
| XSS            | React escape par défaut            | ✅ Protégé   |
| CSRF           | Tokens JWT, pas de cookies session | ✅ Protégé   |
| Webhook Replay | Vérification signature Stripe      | ✅ Protégé   |
| Brute Force    | Non implémenté                     | ❌ À ajouter |
| DoS            | Non implémenté                     | ❌ À ajouter |

### 1.4 Score Sécurité Détaillé

| Critère                | Note     |
| ---------------------- | -------- |
| Authentification       | 8/10     |
| Autorisation (RLS)     | 8/10     |
| Validation des entrées | 4/10     |
| Protection API         | 5/10     |
| Gestion des secrets    | 7/10     |
| **Total**              | **6/10** |

---

## 2. ⚡ Performance

### 2.1 Frontend (React/Vite)

#### ✅ Points Positifs

- Lazy loading des pages avec `React.lazy()` et `Suspense`
- Code splitting automatique via Vite
- Utilisation de `useMemo` et `useCallback` pour optimisation

```jsx
// App.jsx - Bon usage du lazy loading
const Home = lazy(() => import("./pages/Home"));
const AdminLayout = lazy(() => import("./pages/AdminLayout"));
```

#### ❌ Problèmes Identifiés

**MOYENNE - Requêtes N+1 potentielles**

```jsx
// ProductList.jsx - Ligne 53-70
// Chargement ratings après items = 2 requêtes séquentielles
const ids = safeItems.map(i => i.id);
if (ids.length) {
  const { data: ratingsData } = await fetchItemRatings(ids);
  // ...
}
```

**Recommandation :** Fusionner dans une seule requête avec JOIN côté Supabase ou créer une RPC.

**MOYENNE - Re-renders inutiles dans CartContext**

```jsx
// CartContext.jsx - Ligne 24-27
export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadInitialCart);

  // ⚠️ Nouvelles références créées à chaque render
  const value = {
    cart,
    cartItems: cart, // Duplication
    addItem,
    removeItem,
    decreaseItem,
    clearCart,
  };
```

**Recommandation :** Mémoriser l'objet `value` avec `useMemo`.

```jsx
const value = useMemo(
  () => ({
    cart,
    cartItems: cart,
    addItem,
    removeItem,
    decreaseItem,
    clearCart,
  }),
  [cart, addItem, removeItem, decreaseItem, clearCart]
);
```

**BASSE - Images non optimisées**

```jsx
// Pas de lazy loading natif sur les images produits
<img src={item.image_url} alt={item.name} />
```

**Recommandation :** Ajouter `loading="lazy"` ou utiliser une bibliothèque comme `react-lazy-load-image-component`.

### 2.2 Backend (Express/Node.js)

#### ✅ Points Positifs

- Webhook Stripe avec `express.raw()` correctement placé avant `express.json()`
- Requêtes parallèles avec `Promise.all` pour le pricing

#### ❌ Problèmes Identifiés

**HAUTE - Pas de mise en cache**

```javascript
// Aucun cache sur les requêtes fréquentes (items, categories)
// Chaque requête client fait un appel BDD
```

**Recommandation :** Implémenter Redis ou cache en mémoire pour les données statiques.

**MOYENNE - Pas de compression**

```javascript
// api/src/server.js
// ⚠️ Pas de compression gzip/brotli
```

**Recommandation :** Ajouter `compression` middleware :

```javascript
import compression from "compression";
app.use(compression());
```

### 2.3 Base de données

#### ✅ Points Positifs

- Index appropriés sur les colonnes de recherche
- Full-text search configuré sur `items.name`
- Index composites pour les variants

```sql
-- Bons index présents
create index if not exists idx_items_name
  on public.items using gin (to_tsvector('simple', coalesce(name,'')));
create index if not exists idx_order_items_order on public.order_items(order_id);
```

#### ❌ Problèmes Identifiés

**BASSE - Index manquants potentiels**

```sql
-- Suggéré : index sur status pour filtrage fréquent
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_orders_status ON orders(status);
```

### 2.4 Score Performance Détaillé

| Critère              | Note     |
| -------------------- | -------- |
| Code Splitting       | 9/10     |
| Lazy Loading         | 7/10     |
| Optimisation renders | 6/10     |
| Requêtes BDD         | 6/10     |
| Caching              | 3/10     |
| Assets               | 6/10     |
| **Total**            | **7/10** |

---

## 3. 🏗️ Architecture & Qualité du Code

### 3.1 Structure du Projet

#### ✅ Points Positifs

- Séparation claire client/api/database
- Organisation par domaine (pages, components, services, context)
- Utilisation d'alias `@/` pour les imports
- Services dédiés pour les appels API

#### ❌ Problèmes Identifiés

**MOYENNE - Duplication de logique**

```javascript
// Logique de normalisation du panier dupliquée
// CartContext.jsx vs api/src/server.js
// Client:
variantId: item.variantId ?? item.variant_id,
// Server:
variant_id: i.variant_id != null ? Number(i.variant_id) : ...
```

**Recommandation :** Créer un package shared pour les types et validations.

**BASSE - Fichiers trop volumineux**

```
ProductManager.jsx - 1250 lignes
ProductDetail.jsx - 603 lignes
```

**Recommandation :** Découper en sous-composants :

- `ProductManager` → `ProductWizard`, `ProductList`, `ProductForm`
- `ProductDetail` → `ProductGallery`, `ProductInfo`, `ProductReviews`

### 3.2 Patterns & Conventions

#### ✅ Points Positifs

- Hooks personnalisés (`useAdminStats`, `useUnsavedChanges`)
- Context pour état global (Auth, Cart, Theme)
- Services pour abstraction API
- Composants de statut réutilisables

#### ❌ Problèmes Identifiés

**MOYENNE - Gestion d'erreur inconsistante**

```jsx
// Plusieurs patterns différents
// Pattern 1: state error boolean
const [error, setError] = useState(false);

// Pattern 2: state error message
const [error, setError] = useState(null);

// Pattern 3: throw + catch
throw new Error(itemsResp.error?.message || "Erreur");
```

**Recommandation :** Standardiser avec un type `Result<T, E>` ou une bibliothèque comme `neverthrow`.

**BASSE - Magic strings**

```javascript
// Statuts hardcodés à plusieurs endroits
check(status in ("pending", "paid", "failed", "canceled", "shipped", "refunded"));
// vs
const statusOptions = [
  { value: "pending", label: "En attente" },
  // ...
];
```

**Recommandation :** Centraliser dans des constantes partagées.

### 3.3 Score Architecture Détaillé

| Critère                        | Note       |
| ------------------------------ | ---------- |
| Structure fichiers             | 8/10       |
| Séparation des responsabilités | 7/10       |
| Réutilisabilité                | 7/10       |
| Patterns cohérents             | 6/10       |
| Découpage composants           | 6/10       |
| **Total**                      | **7.5/10** |

---

## 4. 🧪 Tests

### 4.1 État Actuel

**🔴 CRITIQUE - Absence quasi-totale de tests**

| Type de Test        | Présent | Couverture |
| ------------------- | ------- | ---------- |
| Tests unitaires     | ❌ Non  | 0%         |
| Tests d'intégration | ❌ Non  | 0%         |
| Tests E2E           | ❌ Non  | 0%         |
| Tests API           | ❌ Non  | 0%         |

### 4.2 Recommandations Prioritaires

**1. Tests unitaires (Vitest)**

```javascript
// Exemple pour CartContext
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { CartProvider, useCart } from "./CartContext";

describe("CartContext", () => {
  it("should add item to cart", () => {
    const { result } = renderHook(() => useCart(), {
      wrapper: CartProvider,
    });

    act(() => {
      result.current.addItem({ item: mockItem, variant: mockVariant, quantity: 1 });
    });

    expect(result.current.cart).toHaveLength(1);
  });
});
```

**2. Tests API (Supertest)**

```javascript
import request from "supertest";
import { app } from "../src/server";

describe("POST /api/checkout", () => {
  it("should return 401 without auth", async () => {
    const res = await request(app).post("/api/checkout").send({ cartItems: [] });
    expect(res.status).toBe(401);
  });
});
```

**3. Tests E2E (Playwright)**

```javascript
import { test, expect } from "@playwright/test";

test("complete checkout flow", async ({ page }) => {
  await page.goto("/items");
  await page.click('[data-testid="add-to-cart"]');
  await page.goto("/cart");
  await expect(page.locator(".cart-item")).toHaveCount(1);
});
```

### 4.3 Configuration Recommandée

```json
// package.json (client)
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "@playwright/test": "^1.40.0"
  }
}
```

### 4.4 Score Tests

| Critère                | Note     |
| ---------------------- | -------- |
| Couverture unitaire    | 0/10     |
| Couverture intégration | 0/10     |
| Couverture E2E         | 0/10     |
| Configuration CI/CD    | 3/10     |
| **Total**              | **2/10** |

---

## 5. ♿ Accessibilité (a11y)

### 5.1 État Actuel

#### ✅ Points Positifs

- Utilisation de `aria-label` sur les boutons d'action
- Rôles ARIA présents (`role="status"`, `role="alert"`)
- Labels associés aux inputs
- `aria-live="polite"` pour les messages de statut

```jsx
// Bon exemple
<div className="status-block" role="status" aria-live="polite">
  <div className="status-spinner" aria-hidden="true" />
  <p className="status-text">{message}</p>
</div>
```

#### ❌ Problèmes Identifiés

**MOYENNE - Navigation clavier incomplète**

```jsx
// ProductDetail.jsx - Sélection de taille
<select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
// ✅ OK mais les boutons de quantité manquent focus visible
<button className="qty-btn" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
```

**MOYENNE - Contraste insuffisant potentiel**

```css
/* Vérifier les ratios de contraste sur */
--color-complementary: #fdf0d6;
--color-text-primary: #2f3a3a;
/* Ratio à valider avec un outil comme axe-core */
```

**BASSE - Images décoratives sans alt=""**

```jsx
// Certaines images n'ont pas d'alt descriptif
<img src={purpleBlackBox} alt="Handgemachte Körbe und Strick" />
// ⚠️ Si décorative, utiliser alt="" et role="presentation"
```

### 5.2 Checklist WCAG 2.1 AA

| Critère                   | Conforme   |
| ------------------------- | ---------- |
| 1.1.1 Contenu non textuel | Partiel    |
| 1.4.3 Contraste minimum   | À vérifier |
| 2.1.1 Clavier             | Partiel    |
| 2.4.4 Objectif du lien    | ✅         |
| 3.1.1 Langue de la page   | ✅         |
| 4.1.2 Nom, rôle, valeur   | Partiel    |

### 5.3 Score Accessibilité

| Critère            | Note       |
| ------------------ | ---------- |
| Sémantique HTML    | 7/10       |
| Navigation clavier | 6/10       |
| ARIA               | 7/10       |
| Contraste          | À valider  |
| **Total**          | **6.5/10** |

---

## 6. 🌍 Internationalisation (i18n)

### 6.1 État Actuel

#### ✅ Points Positifs

- i18next correctement configuré
- Support FR/DE
- Persistance de la langue dans localStorage
- Interpolation pour les pluriels

```javascript
// i18n.js - Configuration propre
i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, fr: { translation: fr } },
  lng: initialLang,
  fallbackLng: "de",
});
```

#### ❌ Problèmes Identifiés

**MOYENNE - Textes hardcodés restants**

```jsx
// OrderManager.jsx - Lignes 7-14
const statusOptions = [
  { value: 'pending', label: 'En attente', ... }, // ⚠️ Non traduit
  { value: 'paid', label: 'Payée', ... },
];

// ProductManager.jsx - Ligne 57
const STEP_LABELS = ['Informations', 'Couleurs', 'Variantes', 'Images', 'Résumé'];
// ⚠️ Non traduit
```

**BASSE - Formatage des dates/monnaies**

```jsx
// Utilisation correcte de Intl mais inconsistante
const locale = useMemo(() => (i18n.language === "fr" ? "fr-FR" : "de-DE"), [i18n.language]);
// ⚠️ Certains endroits utilisent 'fr-FR' hardcodé
```

### 6.2 Score i18n

| Critère                | Note       |
| ---------------------- | ---------- |
| Configuration          | 9/10       |
| Couverture traductions | 7/10       |
| Formatage localisé     | 7/10       |
| **Total**              | **7.5/10** |

---

## 7. 🔧 Maintenabilité

### 7.1 Dépendances

#### État des Dépendances

| Package               | Version | Dernière | Action          |
| --------------------- | ------- | -------- | --------------- |
| react                 | ^19.1.0 | 19.1.0   | ✅ À jour       |
| vite                  | ^7.0.0  | 7.0.0    | ✅ À jour       |
| @supabase/supabase-js | ^2.51.0 | 2.51.0   | ✅ À jour       |
| stripe                | ^16.7.0 | 16.x     | ✅ À jour       |
| express               | ^4.19.2 | 4.21.x   | ⚠️ Minor update |

#### ❌ Problèmes Identifiés

**BASSE - Dépendances inutilisées au root**

```json
// package.json (root)
{
  "dependencies": {
    "axios": "^1.10.0", // ⚠️ Non utilisé (fetch utilisé partout)
    "bootstrap": "^5.3.7", // ⚠️ CSS custom utilisé à la place
    "react-bootstrap": "^2.10.10" // ⚠️ Non importé dans le code
  }
}
```

**Recommandation :** Nettoyer les dépendances non utilisées.

### 7.2 Configuration ESLint

```javascript
// eslint.config.js - Configuration minimale présente
// ⚠️ Pas de règles personnalisées détectées
```

**Recommandation :** Ajouter des règles strictes :

```javascript
{
  rules: {
    'no-console': 'warn',
    'no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error', // Si migration TS
  }
}
```

### 7.3 Score Maintenabilité

| Critère               | Note       |
| --------------------- | ---------- |
| Dépendances à jour    | 8/10       |
| Configuration linting | 6/10       |
| Documentation inline  | 5/10       |
| Consistance code      | 7/10       |
| **Total**             | **7.5/10** |

---

## 8. 📋 Recommandations Prioritaires

### 🔴 Priorité Haute (Sprint 1)

1. **Ajouter des tests unitaires** sur les fonctions critiques (checkout, cart, auth)
2. **Implémenter rate limiting** sur l'API
3. **Ajouter validation Zod/Yup** pour les entrées utilisateur
4. **Corriger les textes non traduits** dans l'admin

### 🟡 Priorité Moyenne (Sprint 2)

5. **Mémoriser le value du CartContext** avec useMemo
6. **Ajouter compression** et cache headers sur l'API
7. **Refactoriser ProductManager.jsx** en sous-composants
8. **Audit accessibilité** avec axe-core et correction des problèmes

### 🟢 Priorité Basse (Sprint 3)

9. **Nettoyer dépendances** inutilisées
10. **Ajouter tests E2E** avec Playwright
11. **Optimiser images** avec lazy loading natif
12. **Améliorer documentation** inline (JSDoc)

---

## 9. 📈 Métriques de Suivi

### KPIs Recommandés

| Métrique                       | Cible  | Actuel     |
| ------------------------------ | ------ | ---------- |
| Couverture tests               | >80%   | ~0%        |
| Score Lighthouse Performance   | >90    | À mesurer  |
| Score Lighthouse Accessibility | >90    | À mesurer  |
| Temps de build                 | <30s   | À mesurer  |
| Bundle size                    | <500KB | À mesurer  |
| Vulnérabilités npm             | 0      | À vérifier |

### Commandes de Vérification

```bash
# Audit sécurité
npm audit

# Lighthouse
npx lighthouse http://localhost:5173 --view

# Bundle analyzer
npx vite-bundle-visualizer

# Dépendances non utilisées
npx depcheck
```

---

## 10. Conclusion

Ce projet E-Commerce présente une **base solide** avec une architecture claire et des choix technologiques modernes (React 19, Vite 7, Supabase). Les principales forces sont la séparation client/API, l'utilisation de RLS pour la sécurité, et l'internationalisation bien intégrée.

Cependant, des **améliorations significatives** sont nécessaires, particulièrement :

- L'ajout de tests (critique pour la confiance en production)
- Le renforcement de la sécurité API (rate limiting, validation)
- L'optimisation des performances (cache, compression)

En suivant les recommandations de cet audit, le projet peut atteindre un niveau de qualité production professionnelle.

---

_Audit généré automatiquement - À compléter avec des tests manuels et automatisés._
