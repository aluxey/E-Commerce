# E-Commerce
E-Commerce showcase site. Suitable for making reservations. Administration panel to manage the site. 

## Sommaire : 
- [Liste des pages de l'application](./Docs/Pages.md)
- [La base de donnée](./Docs/BDD.md)
- [Endpoints de l'API](./Docs/API.md)

## Arborescence du projet

```plaintext
📦 E-Commerce/
├── 📁 Server/         # API Express
│   ├── controllers/
│   ├── routes/
│   ├── db.js          # Connexion à PostgreSQL
│   └── index.js       # Point d'entrée du serveur
│
├── 📁 Client/         # (Front‑end à venir)
│   └── src/
│       └── client.js
│
├── 📁 Database/       # Scripts SQL
│   ├── bd.sql         # Création de la base
│   └── populate.sql   # Données de test
│
├── 📁 Docs/           # Documentation
│   ├── Assets/
│   ├── BDD.md
│   ├── Pages.md
│   └── Roadmap.md
│
├── .env
├── .gitignore
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
