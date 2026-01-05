# 🤖 Instructions pour les Agents IA

> **Lis ce fichier avant toute action sur le projet.**

---

## 📋 Règles Générales

1. **Code simple et lisible** : privilégie la clarté à la complexité
2. **Commente le code** : explique le "pourquoi", pas le "quoi"
3. **Petits fichiers** : un composant/fonction par fichier, < 300 lignes idéalement
4. **Nommage explicite** : variables et fonctions auto-descriptives

---

## 📁 Structure du Projet

```
client/          → Frontend React (Vite)
api/             → Backend Express (Stripe)
Database/        → Migrations SQL, seeds
Docs/            → Documentation technique
```

---

## ✅ Avant de Coder

- [ ] Comprendre le contexte existant (lis les fichiers concernés)
- [ ] Vérifier si une solution similaire existe déjà
- [ ] Identifier les fichiers à modifier

---

## 🛠️ Pendant le Développement

### Code Style

```javascript
// ✅ BON : Simple et commenté
const getActiveProducts = products => {
  // Filtre les produits publiés et en stock
  return products.filter(p => p.status === "active" && p.stock > 0);
};

// ❌ MAUVAIS : Complexe sans explication
const gap = p => p.filter(x => x.s === "a" && x.st > 0);
```

### Composants React

- Utiliser des **functional components** avec hooks
- Extraire la logique complexe dans des **custom hooks**
- Garder les composants **focalisés** sur une seule responsabilité

### CSS

- Utiliser les **variables CSS** existantes (`var(--color-primary)`, etc.)
- Styles scopés par composant ou dans `/styles/`

---

## 📝 Après Modification

### OBLIGATOIRE : Mettre à jour la documentation

Après tout changement significatif, **mets à jour** :

📄 **`Docs/PROJECT_DOCUMENTATION.md`**

- Nouveaux composants/pages ajoutés
- Nouvelles fonctionnalités
- Changements d'architecture
- Nouvelles dépendances

📄 **`Docs/Changelog.md`**

- Date et description courte du changement

---

## ⚠️ À Éviter

- ❌ Code dupliqué : réutilise ou crée un utilitaire
- ❌ Console.log en production : supprime après debug
- ❌ Dépendances inutiles : vérifie si natif suffit
- ❌ Modifications sans contexte : lis avant d'écrire
- ❌ Fichiers > 400 lignes : découpe en sous-composants

---

## 🗄️ Base de Données

- Les migrations vont dans `Database/migrations/`
- Format : `YYYYMMDD_description.sql`
- Toujours tester en local avant de proposer

---

## 🌐 Internationalisation

- Textes UI dans `client/src/locales/{de,fr}/translation.json`
- Utiliser `t('key')` via react-i18next
- Ajouter les traductions dans **les deux langues**

---
