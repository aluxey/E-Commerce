# Code Audit Complet – Sabbels Handmade

**Date**: Decembre 2025  
**Version**: 2.0  

---

## Table des matieres

1. [Resume executif](#resume-executif)
2. [Configuration & Dependances](#1-configuration--dependances)
3. [Base de donnees](#2-base-de-donnees)
4. [API Server (Express)](#3-api-server-express)
5. [Contextes React](#4-contextes-react)
6. [Couche Services](#5-couche-services)
7. [Composants UI](#6-composants-ui)
8. [Pages](#7-pages)
9. [Admin Components](#8-admin-components)
10. [Hooks personnalises](#9-hooks-personnalises)
11. [Internationalisation (i18n)](#10-internationalisation-i18n)
12. [Styles](#11-styles)
13. [Tests](#12-tests)
14. [Securite](#13-securite)
15. [Actions prioritaires](#actions-prioritaires)

---

## Resume executif

| Categorie | Critique | Haute | Moyenne | Basse |
|-----------|----------|-------|---------|-------|
| Configuration | 1 | 0 | 1 | 0 |
| API Server | 1 | 2 | 1 | 0 |
| Frontend | 0 | 3 | 5 | 3 |
| Tests | 1 | 0 | 0 | 0 |
| **Total** | **3** | **5** | **7** | **3** |

**Points forts:**
- Architecture bien structuree (services, contexts, hooks)
- Utilisation correcte de Supabase RLS
- Bonne separation des responsabilites
- Custom hooks bien implementes (`useUnsavedChanges`, `useAdminStats`)

**Points faibles:**
- Aucun test automatise
- Fichier racine `package.json` inutile
- API server ne bloque pas sur variables env manquantes
- ProductManager.jsx trop volumineux (923 lignes)

---

## 1. Configuration & Dependances

### 1.1 Fichier racine `package.json` - CRITIQUE

**Fichier**: `/package.json`

```json
{
  "dependencies": {
    "axios": "^1.10.0",
    "bootstrap": "^5.3.7",
    "classnames": "^2.5.1",
    "cors": "^2.8.5",
    "react-bootstrap": "^2.10.10",
    "react-router-dom": "^7.6.3",
    "react-toastify": "^11.0.5"
  }
}
```

**Probleme**: Ce fichier contient des dependances dupliquees ou inutilisees:
- `axios` - non utilise (le client utilise `fetch`)
- `bootstrap` / `react-bootstrap` - non utilises (CSS custom)
- `classnames` - non utilise
- `cors` - deja dans `/api/package.json`
- `react-router-dom` - deja dans `/client/package.json`
- `react-toastify` - non utilise (custom `ToastHost`)

**Action**: **SUPPRIMER** ce fichier completement.

```bash
rm /package.json
rm -rf /node_modules  # si present
```

### 1.2 Client `package.json` - OK

**Fichier**: `/client/package.json`

Dependances correctes et a jour:
- React 19.1.0
- Vite 7.0.0
- @supabase/supabase-js 2.49.4
- @stripe/react-stripe-js 3.6.1

### 1.3 Vite Config - OK

**Fichier**: `/client/vite.config.js`

Configuration correcte avec alias `@/` pour les imports.

---

## 2. Base de donnees

### 2.1 Schema SQL - BON

**Fichier**: `/Database/BDD_struct.sql`

Structure bien concue avec:
- Tables normalisees
- Relations appropriees (FK)
- Types de donnees corrects

### 2.2 Row Level Security - BON

**Fichier**: `/Database/RLS.sql`

Politiques RLS implementees pour:
- `users` - lecture/modification propre profil
- `orders` - lecture propres commandes
- `items` - lecture publique

---

## 3. API Server (Express)

### 3.1 Variables d'environnement - CRITIQUE

**Fichier**: `/api/src/server.js:13-15`

```javascript
if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables for API server.')
  // PROBLEME: Le serveur continue de tourner!
}
```

**Probleme**: Le serveur ne s'arrete pas si les variables sont manquantes.

**Correction**:
```javascript
if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables for API server.')
  process.exit(1)  // AJOUTER CETTE LIGNE
}
```

### 3.2 Rate Limiting - HAUTE

**Fichier**: `/api/src/server.js`

**Probleme**: Aucun rate limiting configure. Risque de DDoS ou abus.

**Correction**:
```bash
cd api && npm install express-rate-limit
```

```javascript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requetes par IP
  standardHeaders: true,
  legacyHeaders: false,
})

app.use('/api/', limiter)
```

### 3.3 Validation des entrees - HAUTE

**Fichier**: `/api/src/server.js:139-166`

**Probleme**: Validation basique des inputs. Recommande d'utiliser Zod ou Joi.

```bash
cd api && npm install zod
```

```javascript
import { z } from 'zod'

const checkoutSchema = z.object({
  currency: z.string().length(3).default('eur'),
  cartItems: z.array(z.object({
    item_id: z.number().positive(),
    quantity: z.number().min(1),
    variant_id: z.number().positive(),
  })).min(1),
})

app.post('/api/checkout', async (req, res) => {
  const result = checkoutSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error.issues })
  }
  // ...
})
```

### 3.4 Textes hardcodes en francais - MOYENNE

**Fichier**: `/api/src/server.js:149, 158, 161, 164`

```javascript
return res.status(400).json({ error: 'Chaque article doit inclure un variant_id.' })
return res.status(400).json({ error: `Variant ${item.variant_id} introuvable` })
return res.status(400).json({ error: 'Variant et produit incompatibles' })
return res.status(400).json({ error: 'Stock insuffisant pour un des variants' })
```

**Correction**: Utiliser des codes d'erreur:
```javascript
return res.status(400).json({ 
  error: 'VARIANT_REQUIRED',
  message: 'Each item must include a variant_id'
})
```

---

## 4. Contextes React

### 4.1 AuthContext - BON

**Fichier**: `/client/src/context/AuthContext.jsx`

- Gestion correcte de l'etat de chargement
- Subscription aux changements auth Supabase
- Recuperation du role utilisateur

### 4.2 CartContext - BON

**Fichier**: `/client/src/context/CartContext.jsx`

- Persistance localStorage
- Fonctions CRUD completes
- Gestion des variantes

### 4.3 ThemeContext - BON

**Fichier**: `/client/src/context/ThemeContext.jsx`

- Theme clair/sombre
- Persistance preferences

---

## 5. Couche Services

### 5.1 Architecture - BON

Bonne separation des services:
- `/services/items.js` - produits publics
- `/services/orders.js` - commandes utilisateur
- `/services/auth.js` - authentification
- `/services/admin*.js` - fonctions admin

### 5.2 Appels Supabase directs - MOYENNE

**Fichier**: `/client/src/components/Admin/ProductManager.jsx:100-111, 256-268, 386-390`

```javascript
// Ligne 100-111 - Appel direct au lieu du service
const { data: fallbackData, error: fbError } = await supabase
  .from(TABLE_ITEMS)
  .select(`...`)

// Ligne 256-268 - Upload direct
const { error: uploadError } = await supabase.storage
  .from('product-images').upload(filePath, file)

// Ligne 386-390 - Requete directe
const { data: existingVariants, error: existingError } = await supabase
  .from(TABLE_VARIANTS)
  .select('id')
  .eq('item_id', itemId)
```

**Correction**: Deplacer ces appels vers `/services/adminProducts.js`

---

## 6. Composants UI

### 6.1 Navbar - BON

**Fichier**: `/client/src/components/Navbar.jsx`

- Navigation responsive
- Indicateur panier
- Gestion auth

### 6.2 ItemCard - BON

**Fichier**: `/client/src/components/ItemCard.jsx`

- Props bien typees
- Accessibilite (alt images)
- Liens semantiques

### 6.3 ProductFilters - BON

**Fichier**: `/client/src/components/ProductFilters.jsx`

- Filtres par categorie/couleur/prix
- Reset fonctionnel

### 6.4 ErrorBoundary - BON

**Fichier**: `/client/src/components/ErrorBoundary.jsx`

- Capture erreurs React
- UI de fallback

### 6.5 ToastHost - BON

**Fichier**: `/client/src/components/ToastHost.jsx`

- Systeme de notifications custom
- Auto-dismiss
- Export `pushToast` pour usage global

---

## 7. Pages

### 7.1 ProductList - HAUTE (Dependencies useEffect)

**Fichier**: `/client/src/pages/ProductList.jsx`

**Probleme potentiel**: Verifier les dependances useEffect pour eviter boucles infinies.

### 7.2 Pagination - HAUTE

**Probleme**: Aucune pagination sur les listes de produits ou commandes admin.

**Correction**: Implementer pagination cote serveur:
```javascript
// Service
export async function listProducts({ page = 1, limit = 20 }) {
  const from = (page - 1) * limit
  const to = from + limit - 1
  
  const { data, error, count } = await supabase
    .from('items')
    .select('*', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })
  
  return { data, error, count, page, limit }
}
```

### 7.3 Home - BON

**Fichier**: `/client/src/pages/Home.jsx`

Page d'accueil bien structuree.

### 7.4 Cart - BON

**Fichier**: `/client/src/pages/Cart.jsx`

- Affichage panier
- Calcul totaux
- Redirection checkout

---

## 8. Admin Components

### 8.1 ProductManager - HAUTE (Refactoring necessaire)

**Fichier**: `/client/src/components/Admin/ProductManager.jsx`

**Probleme**: 923 lignes - trop volumineux, difficile a maintenir.

**Correction**: Decomposer en sous-composants:

```
/components/Admin/ProductManager/
  index.jsx          # Export principal
  ProductForm.jsx    # Formulaire creation/edition (~200 lignes)
  ProductTable.jsx   # Tableau des produits (~150 lignes)
  VariantEditor.jsx  # Gestion variantes (~200 lignes)
  ColorSelector.jsx  # Selection couleurs (~100 lignes)
  ImageUploader.jsx  # Upload images (~150 lignes)
  useProductForm.js  # Hook etat formulaire (~100 lignes)
```

### 8.2 Textes hardcodes - MOYENNE

**Fichiers**: Tous les composants Admin

Exemples dans ProductManager.jsx:
- Ligne 581: `<h2>Gestion des Produits</h2>`
- Ligne 586: `<label>Nom du produit *</label>`
- Ligne 590: `<label>Statut</label>`
- Ligne 592-594: Options statut en francais
- Ligne 673: `+ Ajouter une variante`
- Ligne 821: `Chargement en cours...`

**Correction**: Utiliser le systeme i18n:
```javascript
import { useTranslation } from 'react-i18next'

export default function ProductAdmin() {
  const { t } = useTranslation()
  
  return (
    <h2>{t('admin.products.title')}</h2>
    // ...
  )
}
```

### 8.3 OrderManager - MOYENNE

**Fichier**: `/client/src/components/Admin/OrderManager.jsx`

Memes problemes de textes hardcodes.

### 8.4 UserManager - MOYENNE

**Fichier**: `/client/src/components/Admin/UserManager.jsx`

Memes problemes de textes hardcodes.

---

## 9. Hooks personnalises

### 9.1 useUnsavedChanges - EXCELLENT

**Fichier**: `/client/src/hooks/useUnsavedChanges.js`

```javascript
// Usage dans ProductManager.jsx:141
useUnsavedChanges(isDirty, 'Des modifications produit ne sont pas sauvegardées. Quitter la page ?')
```

Hook bien concu pour prevenir la perte de donnees.

### 9.2 useAdminStats - BON

**Fichier**: `/client/src/hooks/useAdminStats.js`

Hook pour recuperer les statistiques du dashboard admin.

---

## 10. Internationalisation (i18n)

### 10.1 Configuration - BON

**Fichier**: `/client/src/i18n.js`

i18next configure avec:
- Francais (fr)
- Allemand (de)
- Detection automatique langue navigateur

### 10.2 Couverture - INCOMPLETE

**Fichiers traductions**: `/client/src/locales/{fr,de}/translation.json`

**Couvert**:
- Navigation
- Pages publiques (Home, ProductList, Cart)
- Messages communs

**Non couvert**:
- Interface admin complete
- Messages d'erreur API
- Certains labels de formulaires

---

## 11. Styles

### 11.1 Organisation - BON

```
/client/src/styles/
  global.css        # Variables, reset
  Admin.css         # Styles admin
  adminForms.css    # Formulaires admin
  navbar.css        # Navigation
  ...
```

### 11.2 Styles inline residuels - BASSE

**Fichier**: `/client/src/components/Admin/ProductManager.jsx`

Lignes avec styles inline: 850-851, 853, 861, 871, 884, 886-888, 890-891, 896

```javascript
// Exemple ligne 850-851
style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
```

**Correction**: Deplacer vers CSS:
```css
.product-thumbnail {
  width: 48px;
  height: 48px;
  object-fit: cover;
  border-radius: 6px;
}
```

---

## 12. Tests

### 12.1 Absence de tests - CRITIQUE

**Probleme**: Aucun fichier de test dans le projet.

**Correction**:

1. Installer les dependances:
```bash
cd client && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

2. Configurer Vitest dans `vite.config.js`:
```javascript
export default defineConfig({
  // ...
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
```

3. Creer tests prioritaires:
```
/client/src/__tests__/
  services/items.test.js
  services/auth.test.js
  components/ItemCard.test.jsx
  hooks/useUnsavedChanges.test.js
```

---

## 13. Securite

### 13.1 Variables sensibles - OK

Les cles API sont dans des variables d'environnement.

### 13.2 CORS - OK

**Fichier**: `/api/src/server.js:67-72`

Configuration CORS avec origines specifiques.

### 13.3 Webhook Stripe - OK

**Fichier**: `/api/src/server.js:23-31`

Verification signature correctement implementee.

### 13.4 Protection routes admin - MOYENNE

**Probleme**: Les routes admin sont protegees uniquement cote client via `PrivateRoute`.

**Recommandation**: Ajouter verification role dans les services API si vous ajoutez des endpoints admin.

---

## Actions prioritaires

### CRITIQUE (A faire immediatement)

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 1 | Supprimer package.json racine | `/package.json` | 5 min |
| 2 | Exit sur env vars manquantes | `/api/src/server.js:15` | 2 min |
| 3 | Ajouter tests basiques | Nouveau dossier | 2-4h |

### HAUTE (Cette semaine)

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 4 | Ajouter rate limiting API | `/api/src/server.js` | 30 min |
| 5 | Refactoriser ProductManager | `/client/src/components/Admin/ProductManager.jsx` | 4-6h |
| 6 | Ajouter pagination produits | Services + Pages | 2-3h |

### MOYENNE (Ce mois)

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 7 | Internationaliser admin | `/client/src/components/Admin/*` | 3-4h |
| 8 | Deplacer appels Supabase directs | ProductManager vers services | 1-2h |
| 9 | Ajouter validation Zod API | `/api/src/server.js` | 1-2h |

### BASSE (Quand possible)

| # | Action | Fichier | Effort |
|---|--------|---------|--------|
| 10 | Supprimer styles inline | ProductManager.jsx | 1h |
| 11 | Documenter API (OpenAPI) | Nouveau fichier | 2-3h |
| 12 | Ajouter logs structures | API server | 1-2h |

---

## Commandes rapides

```bash
# Supprimer package.json racine
rm package.json package-lock.json
rm -rf node_modules

# Installer rate limiting
cd api && npm install express-rate-limit

# Installer outils test
cd client && npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Installer validation
cd api && npm install zod
```

---

## Conclusion

Le projet est globalement bien structure avec une bonne separation des responsabilites. Les problemes critiques sont peu nombreux mais doivent etre adresses rapidement:

1. **package.json racine** - source de confusion et de duplications
2. **Variables env** - risque de demarrage avec config incomplete
3. **Tests** - aucune couverture automatisee

Les problemes de haute priorite concernent principalement la maintenabilite (ProductManager trop gros) et la performance (pas de pagination).

L'internationalisation est bien implementee pour les pages publiques mais incomplete pour l'admin.
