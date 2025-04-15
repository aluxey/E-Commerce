# 📦 Base de Données E-commerce - Modèle relationnel

## 📚 Tables

### `item`

| Champ       | Type         | Description                          |
|-------------|--------------|--------------------------------------|
| id          | integer      | Identifiant unique de l'article      |
| name        | varchar(255) | Nom de l'article                     |
| description | text         | Description complète de l'article    |
| price       | integer      | Prix en centimes (ou unité définie)  |
| picture     | varchar(255) | URL ou chemin d'accès à l'image      |
| quantity    | integer      | Quantité en stock                    |

✅ **Choix** : Le champ `picture` est une URL pour éviter le stockage d'images dans la base de données.

---

### `users`

| Champ       | Type          | Description                            |
|-------------|---------------|----------------------------------------|
| id          | integer       | Identifiant unique utilisateur         |
| username    | varchar(50)   | Nom d'utilisateur (unique)            |
| role        | varchar(20)   | Rôle (`client`, `admin`, etc.)         |
| created_at  | timestamp     | Date de création du compte             |
| email       | varchar(100)  | Adresse email (unique)                |
| password    | varchar(255)  | Mot de passe (hashé)                   |

✅ **Choix** :
- `email` et `username` sont uniques pour éviter les doublons.
- `password` est stocké en hashé via un système sécurisé.

---

### `orders`

| Champ       | Type      | Description                                |
|-------------|-----------|--------------------------------------------|
| id          | integer   | Identifiant unique de la commande          |
| user_id     | integer   | Référence vers `users.id`                  |
| created_at  | timestamp | Date de création de la commande            |

🔗 Relation : `user_id` référence l'utilisateur ayant passé la commande.

---

### `order_items`

Table de liaison `many-to-many` entre `orders` et `item`.

| Champ       | Type     | Description                               |
|-------------|----------|-------------------------------------------|
| order_id    | integer  | Référence vers `orders.id`                |
| item_id     | integer  | Référence vers `item.id`                  |
| quantity    | integer  | Quantité de l'article dans la commande    |

🔑 **Clé primaire composée** : `(order_id, item_id)`  
🔗 Relation vers `orders` et `item`

✅ **Choix** :
- Permet de gérer plusieurs articles dans une commande.
- Garde trace des quantités commandées pour chaque article.

---

## 🛠️ Extensions possibles

- Table `order_status` pour suivre les étapes d’une commande.
- Table `reviews` pour permettre aux clients de noter les articles.
- Table `addresses` pour stocker les adresses de livraison.
- Table `cart` pour gérer les paniers temporaires avant validation.

---

## 📂 Fichier SQL associé

> Voir le fichier [sql](../Database/bd.sql) pour le script de création de cette base de données.

Nous allons utiliser PostgreSQL pour notre projet, cela s'explique par la simplicité de mis en place et d'utilisation.