# E-Commerce
Projet vitrine d'une boutique en ligne utilisant **React** pour l'interface et **Supabase** pour la gestion des données et de l'authentification.

## Sommaire :
- [Liste des pages de l'application](./Docs/Pages.md)
- [La partie FrontEnd du projet](./client/README.md)
- [Schéma de la base de données](./Docs/BDD.md)
- [Endpoints de l'API](./Docs/API.md)
- [Architecture générale](./Docs/Architecture.md)

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

## Installation

1. Installer les dépendances du front :

   ```bash
   cd client
   npm install
   ```

2. Créer un fichier `.env.local` dans `client/` avec vos clés Supabase :

   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

3. (Optionnel) Préparer une base Postgres locale :

   ```bash
   psql -U user -d ecommerce -f Database/bd.sql
   psql -U user -d ecommerce -f Database/populate.sql
   ```

4. Lancer le serveur de développement :

  ```bash
  npm run dev
  ```

## Fonctionnalités clés

- Authentification et rôles gérés via Supabase
- Panier persistant grâce au `localStorage`
- Nouvelle page `/cart` pour modifier les quantités et visualiser le total





