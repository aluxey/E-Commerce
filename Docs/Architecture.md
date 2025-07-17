# Architecture de l'application

Cette application s'appuie principalement sur **React** pour le front‑end et **Supabase** pour les services back‑end (authentification, base de données PostgreSQL et stockage d'images).

## Vue d'ensemble

![Flux global](./Assets/front_way_to_work.png)

1. L'utilisateur navigue sur l'application React.
2. Les appels API sont effectués directement vers Supabase via son client JavaScript.
3. Les images des produits sont hébergées dans Supabase Storage.
4. Les règles de sécurité (RLS) assurent que seules les requêtes autorisées sont exécutées.

## Authentification

![Schéma d'auth](./Assets/diagAuth.png)

- Gestion des comptes via Supabase Auth.
- Les informations de session (JWT) sont conservées côté client et utilisées pour les requêtes sécurisées.

Cette architecture réduit la quantité de code serveur à maintenir et permet un déploiement simple sur des plateformes statiques comme Vercel.

## Arborescence du projet

```plaintext
E-Commerce/
├── client/                          # Frontend (React + Vite + Tailwind)
│   ├── public/
│   ├── src/
│   │   ├── assets/                  # Logos, images, SVGs
│   │   ├── components/             # Navbar, ProductCard, etc.
│   │   ├── pages/                  # Home, Shop, Product, Cart, Admin...
│   │   │   └── Admin/              # Dashboard, ProductForm, VariantForm
│   │   ├── api/                    # Fonctions API via Supabase
│   │   ├── auth/                   # AuthContext + hook + role check
│   │   ├── context/                # CartContext (et autres si besoin)
│   │   ├── utils/                  # formatPrice, role utils, etc.
│   │   ├── supabase/               # Supabase client config
│   │   │   └── client.js
│   │   ├── App.jsx                 # Routes + Layout
│   │   ├── index.js                # Entrée React
│   │   └── styles/                 # main.css ou tailwind.css
│   │
│   ├── .env.local                  # SUPABASE_URL / SUPABASE_ANON_KEY
│   └── vite.config.js
│
├── Database/                        # Scripts SQL
│   ├── bd.sql                       # Création des tables
│   └── populate.sql                 # Données de test
│
├── Docs/                           # Spécifications et maquettes
│   ├── Assets/                      # Images utilisées dans la doc
│   ├── API.md
│   ├── BDD.md
│   ├── Pages.md
│   └── Architecture.md
│
└── README.md

```

### Stack technique du projet

| Couche          | Choix recommandé                                     |
| --------------- | ---------------------------------------------------- |
| Frontend        | React + Vite + Tailwind                              |
| Backend         | Supabase (API + Auth)                                |
| BDD             | Supabase PostgreSQL                                  |
| Stockage images | Supabase Storage                                     |
| Paiement        | Stripe                                               |
| Déploiement     | Vercel (front)                                       |
| Monitoring      | Sentry                                               |
