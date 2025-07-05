# 🛍️ Front-End E-commerce

Bienvenue dans la partie front-end de notre projet e-commerce !
Ce projet a été développé avec **React** (via **Vite**), utilise **Bootstrap** pour le style, et interagit avec un back-end Express.

---

## 🔧 Architecture du front-end

Le front suit une architecture simple et efficace :

![Diagramme de fonctionnement](../Docs/Assets/front_way_to_work.png)
*Illustration du fonctionnement global de l'application.*

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
