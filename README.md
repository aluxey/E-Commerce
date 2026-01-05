# Sabbels Handmade E-Commerce

Plateforme e-commerce B2C pour la vente de produits artisanaux faits main.
Application full-stack moderne : **React 19**, **Supabase**, **Stripe**.

---

## ✨ Fonctionnalités

| Module               | Description                                                   |
| -------------------- | ------------------------------------------------------------- |
| **Catalogue**        | Liste produits, filtres (catégorie, couleur, prix), recherche |
| **Panier**           | Ajout/suppression, gestion quantités, persistance locale      |
| **Paiement**         | Checkout Stripe, webhooks, suivi commande                     |
| **Authentification** | Inscription / connexion via Supabase Auth                     |
| **Admin**            | Dashboard KPIs, gestion produits, variantes, commandes, users |
| **i18n**             | Multilingue : Allemand 🇩🇪 / Français 🇫🇷                       |

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────┐
│                     FRONTEND                           │
│   React 19 · Vite 7 · React Router 7 · i18next         │
│   Hébergé sur Netlify                                  │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                        API                             │
│   Express 4 · Node.js · Stripe SDK                     │
└────────────────────────────────────────────────────────┘
                          │
                          ▼
┌────────────────────────────────────────────────────────┐
│                   BASE DE DONNÉES                      │
│   Supabase (PostgreSQL) · Row Level Security           │
└────────────────────────────────────────────────────────┘
```

### Structure du projet

```
E-Commerce/
├── client/             # Frontend React (Vite)
│   ├── src/
│   │   ├── components/ # Composants réutilisables + Admin/
│   │   ├── context/    # AuthContext, CartContext, ThemeContext
│   │   ├── hooks/      # Hooks personnalisés
│   │   ├── pages/      # Pages (Home, ProductList, Cart, Admin…)
│   │   ├── services/   # Abstraction Supabase
│   │   ├── styles/     # Fichiers CSS
│   │   └── locales/    # Traductions DE/FR
│   └── package.json
│
├── api/                # Backend Express (Stripe)
│   └── src/server.js
│
├── Database/           # Scripts SQL & migrations
│   ├── BDD_struct.sql
│   ├── RLS.sql
│   ├── SEED.sql
│   └── migrations/
│
└── Docs/               # Documentation technique
```

---

## 🛠️ Stack technique

| Couche      | Technologies                                   |
| ----------- | ---------------------------------------------- |
| Frontend    | React 19, Vite 7, React Router 7, Lucide, clsx |
| Styling     | CSS custom (variables, responsive)             |
| i18n        | i18next + react-i18next                        |
| Paiement    | Stripe (react-stripe-js)                       |
| Backend     | Express 4, Node.js, Nodemailer                 |
| BDD         | Supabase (PostgreSQL), RLS                     |
| Hébergement | Netlify (client), Supabase (DB)                |

---

## 🚀 Installation

### Prérequis

- Node.js ≥ 18
- Compte Supabase (projet configuré)
- Compte Stripe (clés API)

### 1. Client (Frontend)

```bash
cd client
npm install
cp .env.example .env   # Renseigner VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLIC_KEY
npm run dev            # http://localhost:5173
```

### 2. API (Backend)

```bash
cd api
npm install
cp .env.example .env   # Renseigner STRIPE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run dev            # http://localhost:3001
```

### 3. Base de données

Exécuter dans l'ordre sur votre projet Supabase :

1. `Database/BDD_struct.sql` (schéma)
2. `Database/RLS.sql` (politiques Row Level Security)
3. `Database/SEED.sql` (données initiales, optionnel)

---

## 📜 Scripts disponibles

### Client

| Commande          | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Serveur de développement |
| `npm run build`   | Build de production      |
| `npm run preview` | Prévisualisation build   |
| `npm run lint`    | Analyse ESLint           |

### API

| Commande      | Description                       |
| ------------- | --------------------------------- |
| `npm run dev` | Serveur avec hot-reload (--watch) |
| `npm start`   | Serveur production                |

---

## 📁 Documentation

- [Documentation complète](./Docs/PROJECT_DOCUMENTATION.md)
- [Changelog](./Docs/Changelog.md)
- [Audit technique](./Docs/AUDIT_TECHNIQUE.md)
- [Guide i18n](./Docs/i18n.md)

---

## 🤝 Contribution

1. Lire [Agents.md](./Agents.md) avant toute modification
2. Créer une branche feature (`git checkout -b feature/ma-feature`)
3. Commiter avec des messages clairs
4. Mettre à jour la documentation si nécessaire
5. Ouvrir une Pull Request

---

## 📄 Licence

Projet privé, tous droits réservés.
