# Architecture de l'application

Cette application s'appuie principalement sur **React** pour le front‑end et **Supabase** pour les services back‑end (authentification, base de données PostgreSQL et stockage d'images).

## Vue d'ensemble

![Flux global](./Assets/front_way_to_work.png)

1. L'utilisateur navigue sur l'application React.
2. Les appels API sont effectués directement vers Supabase via son client JavaScript.
3. Les images des produits sont hébergées dans Supabase Storage.
4. Les règles de sécurité (RLS) assurent que seules les requêtes autorisées sont exécutées.

## Authentification

![Schéma d'auth](./Assets/diagAuth.png)

- Gestion des comptes via Supabase Auth.
- Les informations de session (JWT) sont conservées côté client et utilisées pour les requêtes sécurisées.

Cette architecture réduit la quantité de code serveur à maintenir et permet un déploiement simple sur des plateformes statiques comme Vercel.
