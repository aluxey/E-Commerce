# E-Commerce
E-Commerce showcase site. Suitable for making reservations. Administration panel to manage the site.

## Sommaire :
- [Liste des pages de l'application](./Docs/Pages.md)
- [La partie FrontEnd du projet](/client/README.md)
- [La base de donnée](./Docs/BDD.md)
- [Endpoints de l'API](./Docs/API.md)

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
├── database/
│   ├── schema.sql                  # Script complet des tables Supabase
│   └── seed.sql                    # Remplissage de base (items, categories...)
│
├── docs/                           # Spécifications, maquettes, schémas
│   └── architecture.md
│
├── .github/                        # CI/CD si nécessaire
├── .env                            # Variables globales (ex: VITE_*)
└── README.md

```

## Installation

1. Installer les dépendances du serveur :

   ```bash
   cd Server
   npm install
   ```

2. Configurer un fichier `.env` à la racine du projet avec par exemple :

   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/ecommerce
   PORT=3001
   JWT_SECRET=un_secret
   ```

3. Créer la base de données et insérer les données de test :

   ```bash
   psql -U user -d ecommerce -f Database/bd.sql
   psql -U user -d ecommerce -f Database/populate.sql
   ```

4. Lancer le serveur depuis le dossier `Server` :

   ```bash
   node index.js
   ```


### Stakc technique du projet

| Couche          | Choix recommandé                                     |
| --------------- | ---------------------------------------------------- |
| Frontend        | React + Vite + Tailwind                              |
| Backend         | Node.js                                              |
| Auth            | Supabase                                             |
| BDD             | Supasbase                                            |
| Stockage images | Supabase                                             |
| Paiement        | Stripe                                               |
| Déploiement     | Vercel (Front) + Render/Railway (Back + DB)          |
| Monitoring      | Sentry                                               |

