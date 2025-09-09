# Endpoints de l'API

Petit tour d’horizon des routes REST utilisées par la boutique. Les appels
s’appuient sur Supabase pour l’authentification et la base de données.

## Catégories

- `GET /categories` — toutes les catégories
- `GET /categories/:id` — détail d’une catégorie
- `POST /categories` — ajouter (admin)
- `PUT /categories/:id` — modifier (admin)
- `DELETE /categories/:id` — supprimer (admin)

## Produits

- `GET /items` — liste des produits
- `GET /items/:id` — fiche produit
- `POST /items` — créer (admin)
- `PUT /items/:id` — mettre à jour (admin)
- `DELETE /items/:id` — retirer (admin)

Les images sont stockées dans Supabase Storage et référencées via `image_url`.
Une route dédiée gère les variantes : `GET /items/:id/variants`.

## Variantes

- `GET /items/:id/variants` — variations d’un produit
- `POST /items/:id/variants` — ajouter (admin)
- `PUT /variants/:variantId` — modifier
- `DELETE /variants/:variantId` — supprimer

## Commandes

- `GET /orders` — toutes les commandes (admin)
- `GET /orders/user/:userId` — historique d’un client
- `GET /orders/:id` — détail d’une commande
- `POST /orders` — créer une commande
- `PUT /orders/:id/status` — changer le statut
- `DELETE /orders/:id` — annuler (admin)

Champ libre `customization` accepté pour préciser un message ou une option.

## Utilisateurs

- `POST /users/register` — inscription via Supabase Auth
- `POST /users/login` — connexion
- `GET /users/:id` — profil (token requis)

Les rôles `client` et `admin` sont gérés automatiquement par Supabase et
définissent l’accès aux routes.
