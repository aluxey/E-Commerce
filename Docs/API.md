# Endpoints de l'API

Cette page liste les routes disponibles de l'API Express et leur statut d'intégration avec Supabase.

## Catégories

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /categories | Liste des catégories |
| GET | /categories/:id | Détail d'une catégorie |
| POST | /categories | Créer une catégorie |
| PUT | /categories/:id | Modifier une catégorie |
| DELETE | /categories/:id | Supprimer une catégorie |

## Produits (items)

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /items | Liste des produits |
| GET | /items/:id | Détail d'un produit |
| POST | /items | Créer un produit (admin seulement) |
| PUT | /items/:id | Modifier un produit (admin seulement) |
| DELETE | /items/:id | Supprimer un produit (admin seulement) |

**✅ Ajouts récents :**
- Intégration du stockage d'image via Supabase Storage.
- Les URLs des images sont stockées dans `image_url`.
- Prise en charge des variantes via `/items/:id/variants`.

## Variantes de produits

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /items/:id/variants | Liste des variantes d’un produit |
| POST | /items/:id/variants | Ajouter une variante (admin seulement) |
| PUT | /variants/:variantId | Modifier une variante |
| DELETE | /variants/:variantId | Supprimer une variante |

## Commandes

| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /orders | Liste des commandes |
| GET | /orders/user/:userId | Commandes d'un utilisateur |
| GET | /orders/:id | Détail d'une commande |
| POST | /orders | Créer une commande |
| PUT | /orders/:id/status | Modifier le statut d'une commande |
| DELETE | /orders/:id | Supprimer une commande |

**✅ Ajout :** Champ `customization` supporté (champ JSON libre).

## Utilisateurs

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /users/register | Inscription via Supabase Auth |
| POST | /users/login | Connexion via Supabase Auth |
| GET | /users/:id | Profil utilisateur (requiert token) |

**✅ Ajout :** Gestion des rôles (`client`, `admin`) intégrée via Supabase RLS.

## Sécurité et Accès

- Ajout d’un système de rôles via Supabase (`auth.users` + table `profiles` ou `users` personnalisée).
- Middleware `PrivateRoute` sur le front selon rôle.
- JWT automatiquement généré par Supabase et stocké en local.
