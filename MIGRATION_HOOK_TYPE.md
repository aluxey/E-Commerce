# Migration du Type de Crochet - Instructions

## 📋 Changements Implémentés

### ✅ Modifications Frontend
- **ProductDetail.jsx**: Ajout d'un sélecteur de type de crochet (default/rechtsmuster/gaensefuesschen)
- **CartContext.jsx**: Stockage du type de crochet avec `hook_type` et `customization`
- **Cart.jsx**: Affichage du type de crochet dans le panier
- **Stripe.jsx**: Inclusion du type dans le résumé de commande et l'envoi au backend

### ✅ Modifications Backend
- **server.js**: Support du champ `customization` dans `normalizeCartItems()` et création des `order_items`
- **migration SQL**: Suppression de la colonne `pattern_type` et mise à jour de la fonction RPC

### ✅ Nettoyage Code
- **InfoStep.jsx**: Suppression du champ "Style de crochet" de l'administration
- **useProductForm.js**: Nettoyage des références à `pattern_type`
- **ProductDetail.jsx**: Suppression de l'affichage des métadonnées `pattern_type`

### ✅ Traductions
- **Français**: Ajout de `hookType`, `hookTypes`, et `cart.hookType`, `stripe.hookType`
- **Allemand**: Ajout de `Hakeltyp`, `hookTypes`, et `cart.hookType`, `stripe.hookType`

## 🚀 Application de la Migration SQL

### Étape 1: Appliquer la migration
Exécutez le SQL suivant dans votre base de données Supabase:

```sql
-- Contenu du fichier: Database/migrations/20251229_remove_pattern_type_from_items.sql
```

### Étape 2: Vérifier la migration
```sql
-- Vérifier que la colonne a été supprimée
\d public.items

-- Vérifier que la fonction RPC a été mise à jour
\df public.create_item_with_colors
```

## 🔄 Flux de Données Nouveau

1. **Sélection Utilisateur**: Le client choisit un type de crochet dans ProductDetail.jsx
2. **Stockage Panier**: Le type est stocké dans `hook_type` et `customization.hook_type`
3. **Envoi Backend**: Le champ `customization` est envoyé au server.js
4. **Sauvegarde Commande**: Le type est stocké dans `order_items.customization`

## 🧪 Test de l'Implémentation

### 1. Test Frontend
- [ ] Accéder à une page produit
- [ ] Vérifier que le sélecteur de type de crochet apparaît
- [ ] Choisir un type différent de "default"
- [ ] Ajouter au panier
- [ ] Vérifier que le type apparaît dans le panier
- [ ] Passer à la commande et vérifier le résumé

### 2. Test Backend
- [ ] Vérifier que les données de `customization` sont reçues dans `server.js`
- [ ] Confirmer que les `order_items` contiennent le champ `customization`

### 3. Test Base de Données
- [ ] Vérifier que la colonne `pattern_type` n'existe plus
- [ ] Confirmer que `order_items.customization` contient `{"hook_type": "..."}`

## 🎯 Résultat Attendu

- ✅ Tous les produits sont disponibles avec les 3 types de crochet
- ✅ L'utilisateur choisit le type lors de l'ajout au panier
- ✅ Le choix est traçable dans toute la chaîne (panier → commande → BDD)
- ✅ Pas d'impact sur le prix
- ✅ L'administration est simplifiée (plus de sélection au niveau produit)

## 🔄 Rétrocompatibilité

Les commandes existantes ne sont pas affectées car:
- Le champ `customization` existait déjà avec une valeur par défaut `{}`
- Les anciennes commandes n'auront simplement pas de `hook_type` dans ce champ
- Le code frontend gère l'affichage conditionnel du type de crochet