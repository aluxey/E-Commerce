# Changelog: Recent Refactors & UX Improvements

## 2025-12-26: Pattern Type (Style de crochet)

- Ajout du champ `pattern_type` aux produits pour spécifier le style de crochet (Rechtsmuster ou Gänsefüsschen)
- Nouveau formulaire dans le wizard produit (InfoStep)
- Affichage sur la page détail produit
- Migration SQL : `20251226_add_pattern_type_to_items.sql`
- Traductions DE/FR ajoutées
- **Fix:** Le pattern_type est maintenant sauvegardé lors de la modification d'un produit
- **Feature:** Bouton "Tout sélectionner" dans l'étape couleurs du wizard produit

## Auth & Routing

- `AuthContext` now exposes `loading`/`authError` to avoid premature redirects; `PrivateRoute` shows a loader instead of redirecting while auth resolves.
- Login/Signup fetch profile post-auth to redirect by role (admin → `/admin`, others → `/`) and store `last_role`; auth errors are surfaced inline.
- Navbar logout is routed through an auth service helper.

## Shared UI

- Added reusable loading/error blocks (`StatusMessage`) and toasts (`ToastHost`) for consistent feedback; admin layout hosts the toast stack.
- Admin form/grid styles extracted to reduce inline styling.

## Data Services

- Home/List/Detail now use services for Supabase access (`services/items.js`, `services/orders.js`, `services/auth.js`), reducing UI-bound logic.
- Admin services: `adminProducts`, `adminCategories`, `adminVariants`, `adminOrders`, `adminUsers` centralize queries and updates.

## Admin Refactors

- ProductManager uses services, validation, toasts, and form layout.
- CategoryManager uses services, guarded deletes for children/products, toasts, loading/error states.
- VariantManager uses services for CRUD, validation, toasts, loading/error states.
- OrderManager uses services for list/update, toasts, loading/error states.
- UserManager uses services for list/update/delete, filtering/search, toasts, loading/error states.

## Front Pages

- Home, ProductList, ProductDetail, AdminDashboard wired to shared loaders/errors with retry; item/order stats fetched via services.
- Product cards and admin labels now bilingual (DE/FR) with clearer aria-labels; social icons carry explicit aria labels.
- MyOrders view restyled with shared components (status, loaders) and less inline CSS.

## Outstanding / Next Steps

- Continue harmonising copy (DE primary, FR alt) and aria-label sweep across remaining legacy pages (checkout, cart messages, footer links).
- Clean remaining inline styles/palette tokens; ensure auth errors are surfaced consistently.
