# Tests et CI/CD

Ce projet utilise **Vitest** pour exécuter les tests unitaires du front React. Les tests portent principalement sur la logique du panier afin d'éviter toute régression lors des ajouts ou suppressions d'articles.

## Lancer les tests en local

```bash
cd client
npm test
```

## Intégration continue

Un workflow GitHub Actions (`.github/workflows/test.yml`) installe les dépendances, exécute l'analyse ESLint puis lance la suite de tests à chaque *push* ou *pull request*. Toute erreur fait échouer la CI.
