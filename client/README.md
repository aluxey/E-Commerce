# 🛍️ Front-End E-commerce

Bienvenue dans la partie front-end de notre projet e-commerce !
Ce projet a été développé avec **React** (via **Vite**), utilise **Bootstrap** pour le style, et interagit avec un back-end Express.

---

### 🔧 Fonctionnement des products et du panier

![Diagramme de fonctionnement](../Docs/Assets/front_way_to_work.png)
*Illustration du fonctionnement global des panier.*

---

### 🔐 Système d'authentification - Architecture générale

![Diagramme de fonctionnement auth](../Docs/Assets/diagAuth.png)
*Illustration du fonctionnement global de l'auth.*

- **Auth State (Contexte)** : 
  - Stocke les informations de l'utilisateur connecté (`user`) ainsi que les fonctions `login` et `logout`.
  - Est accessible depuis tous les composants via le `AuthContext`.

- **/login** et **/register** :
  - Permettent à l'utilisateur de s'authentifier ou de créer un compte.
  - Si l'authentification réussit, les données de l'utilisateur sont sauvegardées dans l’`AuthContext` et dans le `localStorage`.

- **Routes protégées** :
  - Certaines pages (comme `/account`, `/orders`, etc.) nécessitent que l'utilisateur soit connecté.
  - Le composant `PrivateRoute` vérifie la présence d’un utilisateur avant d’afficher la page.
  - Si l'utilisateur n'est pas connecté, il est redirigé vers `/login`.

- **Notifications (Toasts)** :
  - Utilisées pour informer l’utilisateur de l’état de son action (connexion réussie, erreur, etc.).
  - Déclenchées depuis le contexte ou les composants (`setToastMsg`, `setShowToast`).

### 🔄 Synchronisation

- Les données de l’utilisateur sont persistées dans le `localStorage` pour conserver la session même après un rafraîchissement.
- Lors du chargement de l’application, si un `token` est présent, l'utilisateur est automatiquement rechargé dans l’`AuthContext`.

---

## ✅ Fonctionnalités implémentées

### 🛍️ Page Boutique

- Affichage d’une **grille de produits** (récupérés depuis le backend)
- Chaque produit possède :
  - Une image
  - Un nom
  - Une description
  - Un prix
  - Deux boutons :
    - **Voir le produit** (redirige vers `/product/:id`)
    - **Ajouter au panier**

### 📦 Panier

- Utilisation de **useContext** pour stocker les éléments du panier
- **Ajout et suppression** de produits
- **Quantité et total dynamique**
- **Notifications toast** lors de l’ajout ou la suppression d’un article

### 🔍 Page Produit

- Affichage **détaillé** du produit sélectionné :
  - Image
  - Description
  - Prix
  - Bouton "Ajouter au panier"
- Chargement dynamique via l’URL `/product/:id`

### 🎨 UI/UX

- Thème pastel :
  - Couleurs principales : **beige clair** et **gris foncé**
- Composants stylisés avec **Bootstrap**
- **Animations** d’apparition (cartes, toast) avec Bootstrap ou `
