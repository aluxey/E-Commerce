# E-Commerce
E-Commerce showcase site. Suitable for making reservations. Administration panel to manage the site. 

## Sommaire : 
- [Liste des pages de l'application](./Docs/Pages.md)
- [La base de donnée](./Docs/BDD.md)

## Arborescence du projet

```plaintext 
📦 ton-projet/ 
├── 📁 backend/     # Code serveur (API, Express, etc.)                 
│   ├── 📁 controllers/
│   ├── 📁 models/
│   ├── 📁 routes/
│   ├── 📁 config/
│   │   └── db.js     # Connexion à PostgreSQL
│   └── index.js    # Point d'entrée du serveur
│
├── 📁 frontend/      # Code front-end (React, Vue, etc.)
│   ├── 📁 public/
│   ├── 📁 src/
│   │   └── App.js
│   └── package.json
│
├── 📁 database/      # Tout ce qui est lié à la BDD
│   ├── schema.sql    # 💾 Script de création de la BDD 
│   └── seed.sql      # Données de test à insérer
│
├── 📁 Docs/
│   ├── 📁 Assets/
│   │   ├── SQL_schema.png
│   │   ├── BDD.md
│   └───└── Pages.md
│
├── .env      # Variables d'env (config, DB, etc.)
├── .gitignore
└── README.md       # 📝 Description globale du projet


```