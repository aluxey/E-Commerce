# Présentation de la base de données e-commerce

Ce document présente, **sans entrer dans la technique**, l’organisation de la base de données, les règles d’accès (RLS) et le jeu de **données d’exemple** utilisé pour remplir la base.

---

## 1) Schéma de la base (vue d’ensemble)

La base est organisée autour de 4 grands blocs : **Catalogue**, **Commandes**, **Paiements**, **Utilisateurs & Avis**.

### 🛍️ Catalogue

- **Catégories** : les familles de produits (ex. _Accessoires_, _Décoration_…).
- **Couleurs** : référentiel global des coloris textiles disponibles (nom + code couleur) pour harmoniser le catalogue.
- **Produits** : chaque fiche produit (nom, description, prix de base, image principale, lien vers une catégorie).
- **Variantes** : déclinaisons d’un produit (taille, stock et prix propres).
- **Images de produit** : plusieurs images possibles pour un même produit, avec un ordre d’affichage.
- **Notes & avis** : une évaluation (1 à 5 étoiles) par utilisateur et par produit, avec commentaire.

**Idée clé** :
Un **produit** peut avoir **plusieurs variantes** (ex. tailles), **plusieurs images**, et **plusieurs avis**. Les variantes portent le **stock** réel vendu. Le référentiel de **couleurs** est **global** : il n’existe plus de table de liaison produit-couleur, et toutes les couleurs peuvent etre proposees a tous les produits cote interface.

### 🧾 Commandes

- **Commandes** : une commande appartient à **un utilisateur**, possède un **statut** (en attente, payée, expédiée, etc.), un **montant total** et une **adresse de livraison**.
- **Lignes de commande** : le détail de ce qui est acheté : pour une commande donnée, on liste les **produits/variantes**, la **quantité** et le **prix unitaire** au moment de l’achat.
  > Le total de la commande est la somme des lignes.

**Idée clé** :
Une **commande** regroupe **plusieurs lignes**, chacune pointant vers **une variante** précise d’un produit. La commande conserve aussi une **adresse de livraison** et une reference de paiement pour fiabiliser le suivi.

### 💳 Paiements

- **Paiements** : enregistrement de ce que le fournisseur de paiement renvoie (montant, devise, statut, identifiant externe).
- **Événements de paiement** : trace minimale d’événements reçus (utile pour éviter les doublons côté webhooks).

**Idée clé** :
Un **paiement** est rattaché à **une commande**. On conserve l’**identifiant du fournisseur** (ex. Stripe) pour assurer l’unicité et le suivi.

### 👤 Utilisateurs & rôles

- **Utilisateurs** : reflète les comptes d’authentification (un enregistrement par personne). Chaque utilisateur a un **rôle** : _client_ ou _admin_.
- **Avis** : chaque utilisateur peut donner **un seul avis** par produit (étoiles + commentaire).

**Idée clé** :
Le **rôle** détermine les permissions : un _admin_ peut gérer le catalogue, un _client_ consulte le catalogue et gère **ses** commandes/avis.

---

## 2) Règles d'accès (RLS): qui voit quoi?

Les RLS (Row-Level Security) définissent **qui peut lire ou modifier** quelles données, **table par table**. Voici la logique fonctionnelle :

### Catalogue (catégories, produits, variantes, images, avis)

- **Lecture** : ouverte à tout le monde pour le **catalogue** (visiteurs et utilisateurs connectés).
- **Écriture** : **réservée aux administrateurs** pour tout ce qui concerne le **catalogue** (ajout/modification/suppression de produits, variantes, images).
- **Avis** :
  - Tout le monde peut **lire** les avis.
  - Un utilisateur **ne peut créer/modifier/supprimer que ses propres avis**.

### Commandes & lignes de commande

- **Lecture** : un utilisateur **voit uniquement ses propres commandes**. Les administrateurs peuvent tout voir.
- **Création** : un utilisateur **ne peut créer des commandes que pour lui-même**.
- **Mise à jour & suppression** : **administrateurs uniquement** (pour éviter les fraudes et garder un flux "backend-driven").

### Paiements & événements de paiement

- **Lecture/Écriture** : **administrateurs uniquement** (les écritures réelles se font côté serveur).

### Utilisateurs

- **Lecture/Écriture** : un utilisateur **voit et met à jour uniquement sa propre fiche** ; un **admin** peut tout gérer.

### Stockage des images (bucket `product-images`)

- **Lecture des fichiers** : publique (utile pour afficher les images produits sur le site).
- **Écriture (upload/mise à jour/suppression)** : **réservée aux administrateurs** pour éviter qu’un simple compte ne publie du contenu dans le bucket produit.

> Résumé : _Public = lecture du catalogue_ ; _Client connecté = ses commandes/avis_ ; _Admin = gestion complète_.

---

## 3) Remplissage de la base (jeu de données d’exemple)

Le remplissage (seed) sert à **démarrer rapidement** avec des données réalistes pour tester le front et les parcours. Il est **idempotent** : vous pouvez le relancer sans créer de doublons. Il comprend :

### Comptes

- **Un administrateur** (lié à un email existant dans l’authentification) pour gérer le catalogue.
- **Un client** (lié à un autre email) pour simuler de vraies commandes.

### Catalogue initial

- **Catégories** : _Accessoires_, _Décoration_, _Bébé_, _Peluches_.
- **Produits** : exemples variés (ex. _Bonnet torsadé_, _Plaid cocoon_, _Chaussons bébé_, _Amigurumi lapin_).
- **Variantes** : tailles différentes avec **stock** et **prix** adaptés.
- **Images** : une image par produit (URL d’exemple), extensible par la suite.
- **Avis** : quelques évaluations pour donner un premier rendu sur la boutique.

### Commandes & paiements

- **Deux commandes fictives** pour le client :
  - une **en attente** (panier non payé),
  - une **payée** (avec un **paiement** enregistré).
- Les totaux sont recalculés automatiquement à partir des **lignes de commande**.

**Bénéfice** :
Dès le premier lancement, la boutique affiche des **produits**, un **stock** et des **commandes** crédibles, ce qui permet de **tester le parcours complet** (catalogue → panier → commande → paiement).

---

## 4) Ce qu’il faut retenir

- Le **catalogue** est public en lecture ; tout le reste respecte la logique “**je ne vois et ne modifie que ce qui m’appartient**”, sauf pour les **admins**.
- Les **variantes** sont la source de vérité pour le **stock** et les **déclinaisons vendues**.
- Les **commandes** s’additionnent à partir de leurs **lignes** ; les **paiements** valident le passage au statut _payé_.
- Le **seed** fournit un environnement de démo complet, **relançable sans risques**.

---

## 5) Glossaire rapide

- **Produit** : fiche commerciale (titre, description, prix de base).
- **Variante** : déclinaison vendue (taille) avec **son stock** et **son prix**.
- **Commande** : panier validé appartenant à un utilisateur.
- **Ligne de commande** : un article (variante) au sein d’une commande.
- **RLS** : règles qui déterminent **qui a le droit** d’accéder/modifier **quelle ligne** d’une table.
- **Bucket** : “dossier” de stockage de fichiers (images) côté Supabase.
