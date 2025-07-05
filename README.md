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
├── client/               # Frontend (React + Vite + Tailwind)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/          # Appels API centralisés via React Query
│   │   ├── auth/         # Auth provider & hooks
│   │   ├── utils/        # Fonctions d’aide (formatage, etc.)
│   │   └── main.tsx
│   └── vite.config.ts
│
├── server/              # Backend (Node.js + Express ou Fastify)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── prisma/       # Prisma schema & client
│   │   ├── utils/
│   │   └── index.ts
│   ├── .env
│   └── tsconfig.json
│
├── docs/                # Spécifications techniques, schémas
├── database/            # Script SQL ou schema.prisma
├── .github/             # Actions CI/CD si besoin
├── .env
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
| Auth            | Auth.js                                              |
| BDD             | PostgreSQL                                           |
| Stockage images | Cloudinary                                           |
| Paiement        | Stripe                                               |
| Déploiement     | Vercel (Front) + Render/Railway (Back + DB)          |
| Monitoring      | Sentry                                               |

