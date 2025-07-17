
# 📦 Base de Données E-commerce - Supabase

## 📚 Tables principales

### `items`
| Champ       | Type         | Description                          |
|-------------|--------------|--------------------------------------|
| id          | integer      | Identifiant unique                   |
| name        | text         | Nom                                  |
| description | text         | Description complète                 |
| base_price  | integer      | Prix de base (en centimes)           |
| image_url   | text         | URL vers l'image stockée             |
| created_at  | timestamp    | Date d'ajout                         |

✅ Images stockées dans Supabase Storage via bucket `product-images`.

---

### `item_variants`
| Champ       | Type         | Description                          |
|-------------|--------------|--------------------------------------|
| id          | integer      | Identifiant                          |
| item_id     | integer      | Référence vers `items.id`            |
| color       | text         | Couleur                              |
| format      | text         | Format / taille                      |
| stock       | integer      | Stock disponible                     |
| extra_price | integer      | Surcoût optionnel (centimes)        |

🔗 Relation : chaque produit peut avoir plusieurs variantes.

---

### `users` (profils personnalisés de Supabase Auth)
| Champ       | Type         | Description                          |
|-------------|--------------|--------------------------------------|
| id          | uuid         | Référence à `auth.users.id`          |
| email       | text         | Email utilisateur                    |
| role        | text         | `client` ou `admin`                  |
| created_at  | timestamp    | Date de création                     |

✅ Supabase Auth gère le compte, cette table enrichit le profil avec le rôle.

---

### `orders`
| Champ       | Type         | Description                          |
|-------------|--------------|--------------------------------------|
| id          | integer      | Identifiant de la commande           |
| user_id     | uuid         | Référence vers `users.id`            |
| created_at  | timestamp    | Date de la commande                  |

---

### `order_items`
| Champ         | Type     | Description                               |
|---------------|----------|-------------------------------------------|
| order_id      | integer  | Référence vers `orders.id`                |
| item_variant_id | integer | Référence vers `item_variants.id`         |
| quantity      | integer  | Quantité commandée                        |
| customization | json     | Détail personnalisé (texte libre)         |

🔑 Clé composée : `(order_id, item_variant_id)`.

---

## 🔐 Sécurité Supabase (RLS)
- Règles activées : accès en lecture/écriture restreint selon `auth.uid()`.
- Lecture filtrée par rôle ou userId.
- Gestion automatique des permissions via Supabase Policy Editor.

---

## 🗃️ Fichier SQL associé
Fichier de création automatique exportable via `Table Editor` ou CLI Supabase.

📁 Export prévu dans : `Database/bd.sql`
📁 Exemple de seed : `Database/populate.sql`
