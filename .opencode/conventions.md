# Conventions et Pratiques de Code

> Ce fichier est la reference unique des regles de code du projet.
> Lis-le integralement avant toute modification.

---

## 1. Principes Generaux

1. **Code simple et lisible** : privilegier la clarte a la complexite.
2. **Commenter le "pourquoi"** : expliquer les decisions, pas le "quoi" evident.
3. **Petits fichiers** : un composant ou une fonction par fichier, < 300 lignes (max absolu 400).
4. **Nommage explicite** : variables et fonctions auto-descriptives.
5. **Pas de code duplique** : reutiliser ou creer un utilitaire dans `utils/`.
6. **Pas de dependance inutile** : verifier si le natif suffit avant d'ajouter un package.

---

## 2. Langage et Formatage

- **Langage** : JavaScript pur (`.js` / `.jsx`), pas de TypeScript.
- **Modules** : ES modules (`import` / `export`), jamais de `require`.
- **Semicolons** : toujours les mettre en fin d'instruction.
- **Indentation** : 2 espaces, pas de tabulations.
- **Quotes** : double quotes (`"`) pour le JSX, sinon double quotes partout par coherence.
- **Virgules finales** : trailing commas dans les objets et tableaux multi-lignes.
- **Longueur de ligne** : viser ~100 caracteres max, decouper si necessaire.
- **Fonctions flechees** : privilegier `const fn = () => {}` pour les fonctions utilitaires et callbacks.

---

## 3. Nommage

| Type | Convention | Exemple |
|------|-----------|---------|
| Composants React | PascalCase `.jsx` | `ProductManager.jsx` |
| Pages | PascalCase `.jsx` | `AdminDashboard.jsx` |
| Services | camelCase `.js` | `adminProducts.js` |
| Hooks | `use` + PascalCase `.js` | `useAdminStats.js` |
| Utilitaires | camelCase `.js` | `formatters.js` |
| Variantes UI | camelCase + `Variants.js` | `buttonVariants.js` |
| Fichiers CSS | PascalCase ou kebab-case `.css` | `ProductList.css` |
| Tables SQL | snake_case | `item_variants` |
| Colonnes SQL | snake_case | `created_at` |
| Variables JS | camelCase | `cartItems` |
| Constantes | SCREAMING_SNAKE_CASE | `MAX_UPLOAD_SIZE` |

---

## 4. Structure du Projet

```
E-Commerce/
  client/                  # Frontend React (Vite)
    src/
      components/          # Composants reutilisables
        ui/                # Bibliotheque UI (Button, Card, Modal, Input, Badge, etc.)
        Admin/             # Composants specifiques admin (managers, formulaires)
      pages/               # Composants de pages (un fichier = une route)
      services/            # Abstraction Supabase (jamais d'appels directs depuis les composants)
      hooks/               # Custom hooks (logique metier extraite)
      context/             # React Contexts (etat global)
      utils/               # Fonctions utilitaires pures
      styles/              # Fichiers CSS par composant
      locales/             # Traductions i18n (de/, fr/)
      supabase/            # Configuration client Supabase
      config/              # Feature flags et configuration
      assets/              # Images, fonts
      mobile/              # Composants specifiques mobile
  api/                     # Backend Express
    src/
      server.js            # Point d'entree unique
  Database/                # SQL (schema, RLS, seeds, migrations)
    migrations/            # Format: YYYYMMDD_description.sql
  Docs/                    # Documentation technique
```

---

## 5. Composants React

### Regles

- **Fonctionnels uniquement** : pas de composants classe (sauf `ErrorBoundary`).
- **Destructurer les props** : `function Component({ title, items })`.
- **Une seule responsabilite** : si un composant fait trop, decouper.
- **Extraire la logique complexe** dans un custom hook.
- **Lazy loading** : les pages sont importees avec `React.lazy()` dans `App.jsx`.

### Pattern Context

Le projet suit un pattern strict en 3 fichiers :

```
context/
  FooContextObject.js   # createContext() + export du contexte
  FooContext.jsx         # Provider avec la logique
hooks/
  useFoo.js             # Hook d'acces au contexte
```

Exemple :
```javascript
// context/CartContextObject.js
import { createContext } from "react";
export const CartContext = createContext(null);

// context/CartContext.jsx
import { CartContext } from "./CartContextObject";
export function CartProvider({ children }) {
  // ... logique
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// hooks/useCart.js
import { useContext } from "react";
import { CartContext } from "../context/CartContextObject";
export function useCart() {
  return useContext(CartContext);
}
```

### Composants UI

Les composants UI (`components/ui/`) utilisent un systeme de variantes :

- Chaque composant a un fichier de variantes associe dans `utils/` (ex: `buttonVariants.js`).
- Utiliser `cn()` (wrapper `clsx` + `tailwind-merge`) pour composer les classes.
- Exporter via le barrel `components/ui/index.js`.

---

## 6. Services (Couche d'Abstraction)

- **Jamais d'appels Supabase directs** dans les composants ou pages.
- Toute interaction avec la BDD passe par un fichier dans `services/`.
- Les services exportent des **fonctions async nommees**.
- Separer les services admin (`adminProducts.js`, `adminOrders.js`, etc.) des services utilisateur (`items.js`, `orders.js`, etc.).
- Pattern standard :

```javascript
import { supabase } from "@/supabase/supabaseClient";

export const fetchItems = async () => {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("status", "active");

  if (error) throw error;
  return data;
};
```

---

## 7. Hooks Personnalises

- Prefix `use` obligatoire.
- Un hook = une responsabilite claire.
- Placer dans `hooks/`.
- Exemples existants : `useCart`, `useTheme`, `useAdminStats`, `useProductForm`, `useInteractions`, `useUnsavedChanges`, `useFormValidation`.

---

## 8. Styles CSS

- **Variables CSS** : utiliser le design system defini dans `global.css` (`var(--color-primary)`, `var(--spacing-md)`, etc.).
- **Pas de classes Tailwind** : malgre la presence de `tailwind-merge`, le projet utilise du CSS custom.
- **Un fichier CSS par composant** dans `styles/`.
- **Nommage BEM-ish** : `.component__element--modifier` (ex: `.navbar__brand`, `.admin-nav__link--active`).
- **Responsive** : verifier le rendu mobile pour tout nouveau composant.
- **Fonts** : Cormorant Garamond (titres) + Work Sans (corps).

---

## 9. Commentaires et Langue

- **Commentaires en francais**.
- **Textes de l'UI** : toujours via i18n (`t('cle')`), jamais en dur dans le JSX.
- **Deux langues obligatoires** : ajouter les traductions dans `locales/de/translation.json` ET `locales/fr/translation.json`.
- L'allemand (`de`) est la langue par defaut.
- Utiliser `useTranslation()` de `react-i18next`.

---

## 10. Gestion d'Erreurs

- **ErrorBoundary** a la racine pour les erreurs React fatales.
- **Error mappers** dans `utils/errorMappers.js` pour transformer les erreurs Supabase en messages lisibles.
- **StatusMessage** / composants `LoadingMessage` et `ErrorMessage` pour les etats de chargement/erreur.
- **Toast custom** : utiliser `pushToast()` depuis `utils/toast.js` (pas react-toastify). Le `ToastHost` ecoute et affiche les notifications.

---

## 11. Imports

- Utiliser l'alias `@/` pour les imports depuis `client/src/`.
- Ordre recommande dans un fichier :
  1. Imports React / bibliotheques externes
  2. Imports internes (`@/components/...`, `@/services/...`, `@/hooks/...`)
  3. Imports de styles
- Pas de barrel exports excessifs sauf pour `components/ui/index.js`.

```javascript
// Exemple d'ordre
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useCart } from "@/hooks/useCart";
import { fetchItems } from "@/services/items";
import { Button, Card } from "@/components/ui";

import "@/styles/ProductList.css";
```

---

## 12. API Backend (Express)

- Le backend est **minimaliste** : il ne gere que Stripe, le formulaire de contact et le nettoyage des commandes.
- Authentification via `Authorization: Bearer <token>` valide avec `supabase.auth.getUser(token)`.
- Toujours valider les entrees cote serveur (ne jamais faire confiance au client).
- Les webhooks Stripe utilisent le body brut (`express.raw()`).

---

## 13. Base de Donnees

- Les migrations vont dans `Database/migrations/`, format `YYYYMMDD_description.sql`.
- Mettre a jour `Database/BDD_struct.sql` si le schema change.
- Mettre a jour `Database/RLS.sql` si de nouvelles policies sont ajoutees.
- Toujours tester les requetes SQL dans l'editeur Supabase avant de les integrer.
- Les triggers `updated_at` sont automatiques sur la plupart des tables.

---

## 14. Git et Commits

- Format de commit : `type: description courte`
- Types : `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Branches depuis `main` : `feature/nom-feature`, `fix/nom-bug`
- Ne jamais commiter de fichiers `.env`.

---

## 15. Avant de Coder (Checklist)

- [ ] Lire les fichiers concernes pour comprendre le contexte existant
- [ ] Verifier si une solution similaire existe deja
- [ ] Identifier tous les fichiers a modifier

---

## 16. Apres Modification (Checklist)

- [ ] Pas d'erreurs ESLint (`npm run lint` dans `client/`)
- [ ] Traductions ajoutees (DE + FR) si nouveau texte UI
- [ ] CSS responsive verifie
- [ ] Pas de `console.log` en production
- [ ] Mettre a jour `Docs/PROJECT_DOCUMENTATION.md` si changement significatif
- [ ] Mettre a jour `Docs/Changelog.md` avec la date et la description

---

## 17. A Eviter

- Code duplique : reutiliser ou creer un utilitaire.
- `console.log` en production : supprimer apres debug.
- Dependances inutiles : verifier si le natif suffit.
- Modifications sans contexte : lire avant d'ecrire.
- Fichiers > 400 lignes : decouper en sous-composants.
- Appels Supabase directs dans les composants : passer par les services.
- Textes en dur dans le JSX : utiliser i18n.
- Classes CSS en ligne (`style={{}}`) : utiliser les fichiers CSS.
