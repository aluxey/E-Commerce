# 🛍️ Roadmap - Projet E-commerce

Les grandes étapes prévues pour faire évoluer la boutique. Coche les cases au fur et à mesure ✅

---

## 1️⃣ Finalisation du parcours client

### 🛒 Panier (`Cart`)
- [ ] Ajouter / retirer / modifier la quantité d’un item
- [ ] Persistance via `localStorage` ou `React context`
- [ ] Affichage dynamique dans la page `/cart`

### 🎨 Déclinaisons produit
- [ ] Affichage des variantes (taille, couleur, etc.)
- [ ] Gestion du stock par variante via Supabase
- [ ] Champ de personnalisation libre avec mention de délai

### 🧾 Page commande (Checkout)
- [ ] Formulaire d’adresse + livraison (statique pour l’instant)
- [ ] Résumé du panier
- [ ] Création d’une `order` + `order_items` dans Supabase à validation

---

## 2️⃣ Paiement Stripe

### 🔐 Intégration Stripe
- [ ] Création du compte Stripe + clés API
- [ ] Route backend `/create-checkout-session`
- [ ] Redirection frontend vers Stripe Checkout
- [ ] Gestion des retours success / cancel

### 📬 Webhooks
- [ ] Traitement du webhook `checkout.session.completed`
- [ ] Mise à jour de la commande (`paid` → `true`)
- [ ] Sécurité de la signature du webhook

---

## 3️⃣ Dashboard Admin

### 🔐 Sécurité
- [ ] Auth Supabase avec rôle (`admin` / `client`)
- [ ] Redirection conditionnelle selon rôle
- [ ] `PrivateRoute` ou middleware pour protéger les pages admin

### 📋 Interface Admin
- [ ] Liste des produits (pagination, actions CRUD)
- [ ] Formulaire ajout / édition produit
- [ ] Gestion des variantes (formats, prix, stock)
- [ ] Liste des commandes (filtrage par statut)

### 🔐 Supabase RLS
- [ ] Restriction des accès aux tables selon rôle
- [ ] Vérification que seul un admin peut modifier les produits

---

## 4️⃣ Interface client & UI

### 🏠 Page d’accueil
- [ ] Bannière ou carrousel d’accroche
- [ ] Produits populaires, promos ou nouveautés
- [ ] CTA clair vers la boutique

### 🛍️ Page boutique
- [ ] Filtres dynamiques (prix, catégorie, stock)
- [ ] Grille responsive
- [ ] Infos produit claires (promo, stock faible, etc.)

### ✨ Améliorations UX
- [ ] Animation lors de l’ajout au panier
- [ ] Notifications (toast) pour feedback utilisateur
- [ ] Design homogène avec charte pastel (beige, gris foncé)

---

## ⏭️ Étapes futures

- [ ] Intégration analytics (Plausible ou Google Analytics)
- [ ] Emails transactionnels (commande confirmée / expédiée)
- [ ] Système de promo / code de réduction
- [ ] Intégration d’un CMS headless pour la gestion avancée

---

📅 Dernière mise à jour : 2025-09-09
