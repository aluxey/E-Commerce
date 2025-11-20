# Code Audit – Sabbels Handmade (updated)

## Résumé rapide
- Auth: resolved loading flashes; role-based redirects in place; errors surfaced in forms.
- Data: services now cover items/orders/auth and admin flows; few direct Supabase calls left.
- UI/UX: shared loaders/errors/toasts added; admin forms/services refactored; DE/FR labels and aria improved; remaining pages still mixed.
- Styles: many inlines removed (MyOrders, admin forms), some remain in legacy pages; palette tokens partially cleaned.

## Détails et points à corriger
- **Auth/Routes**
  - Role redirect in login/signup stored via `last_role`; confirm desired UX (e.g., remember last page vs force home/admin).
  - Auth errors surface in forms but not globally (e.g., navbar). No loading state in nav actions.
- **Données/Services**
  - Items/orders/auth + admin managers use services. Remaining: check any lingering direct Supabase calls before adding new features.
- **Formulaires/UX**
  - Admin managers now validated with toasts. Some public forms (contact/newsletter) still lack validation feedback.
- **Langue**
  - DE/FR mix improved on admin/product cards/orders/cart/success; other pages still mixed (Checkout, Footer links, misc. copy).
  - No i18n framework; texts are hardcoded.
- **Styles**
  - MyOrders and admin forms moved off inline styles; legacy pages still contain inline blocks (Cart, ProductDetail meta, etc.).
  - Old palette tokens (`--color-cream-*`) still referenced in legacy CSS; plan a find/replace to new tokens.
- **Accessibilité**
  - Many icon buttons have aria-labels; recheck checkout/buttons and any remaining icons for consistency.

## Reco d’actions restantes (priorisées)
1) Langue/accessibilité: finish DE/FR copy sweep, add aria-labels to remaining icon buttons, decide on i18n plan.
2) Styles: remove remaining inline styling in legacy pages; replace old palette tokens.
3) Auth UX: optional global auth error banner/navbar indicator; confirm redirect strategy.
4) Tests/QA: smoke-test admin flows after service refactors; verify toasts cover all error paths.
