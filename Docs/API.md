# Endpoints de l'API

Cette page liste les routes disponibles de l'API Express.

## Catégories

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /categories | Liste des catégories |
| GET | /categories/:id | Détail d'une catégorie |
| POST | /categories | Créer une catégorie |
| PUT | /categories/:id | Modifier une catégorie |
| DELETE | /categories/:id | Supprimer une catégorie |

## Produits

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /items | Liste des produits |
| GET | /items/:id | Détail d'un produit |
| POST | /items | Créer un produit |
| PUT | /items/:id | Modifier un produit |
| DELETE | /items/:id | Supprimer un produit |

## Commandes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /orders | Liste des commandes |
| GET | /orders/user/:userId | Commandes d'un utilisateur |
| GET | /orders/:id | Détail d'une commande |
| POST | /orders | Créer une commande |
| PUT | /orders/:id/status | Modifier le statut d'une commande |
| DELETE | /orders/:id | Supprimer une commande |

## Utilisateurs

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /users/register | Inscription |
| POST | /users/login | Connexion |
| GET | /users/:id | Profil utilisateur |
