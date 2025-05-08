# 🛣️ Roadmap du Projet E-Commerce

## 1. Planification & Maquettage
- ✅ Créer des maquettes.
- 🔲 Définir les user stories (ex: "En tant qu'utilisateur, je veux voir tous les produits").
- 🔲 Préparer un cahier des charges fonctionnel léger.

## 2. Conception de la Base de Données
- ✅ Schéma initial réalisé.
- 🔲 Améliorer la base de données (cf. critique ci-dessous).
- ✅ Remplir avec des données de test.

## 3. Backend
- 🔲 Créer une API REST (ou GraphQL si souhaité) avec les routes suivantes :
  - GET /items
  - GET /items/:id
  - POST /orders
  - POST /users/register, POST /users/login

- 🔲 Ajouter une gestion JWT pour l’authentification.
- 🔲 Valider les données (ex: express-validator si Node.js/Express).

## 4. Frontend
- 🔲 Lister les produits (HomePage)
- 🔲 Page de produit avec ajout au panier
- 🔲 Panier + validation de commande
- 🔲 Authentification et profil utilisateur

## 5. Fonctionnalités supplémentaires
- 🔲 Recherche + Filtres (prix, catégories)
- 🔲 Admin : ajout/modif produits
- 🔲 Historique des commandes

## 6. Tests
- 🔲 Tests unitaires (backend & frontend)
- 🔲 Tests d’intégration (ex: commandes)
- 🔲 Mock de la base (ex: sqlite en mémoire)

## 7. Déploiement
- 🔲 Dockerisation (optionnel mais recommandé)
- 🔲 Déploiement (Vercel/Netlify pour front, Render/Railway/Heroku pour back)
- 🔲 CI/CD minimal avec GitHub Actions
