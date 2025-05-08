-- Catégories
INSERT INTO category (name) VALUES
('Accessoires'),
('Maison'),
('Vêtements');

-- Utilisateurs
INSERT INTO users (username, email, password, role) VALUES
('aurelien', 'aurelien@example.com', 'hashed_password1', 'client'),
('admin', 'admin@example.com', 'hashed_password2', 'admin'),
('claire', 'claire@example.com', 'hashed_password3', 'client');

-- Produits
INSERT INTO item (name, description, price, picture, quantity, category_id) VALUES
('Chaussettes en laine', 'Chaussettes douillettes pour l’hiver', 1200, 'chaussettes.png', 50, 3),
('Mug en céramique', 'Mug artisanal peint à la main', 1800, 'mug.png', 30, 2),
('Bonnet tricoté', 'Bonnet chaud fait main', 1500, 'bonnet.png', 25, 1),
('Plaid tissé main', 'Plaid doux et chaud', 3500, 'plaid.png', 10, 2);

-- Commandes
INSERT INTO orders (user_id, status, shipping_address) VALUES
(1, 'pending', '12 rue du Code, Paris'),
(3, 'shipped', '34 avenue des Tests, Lyon');

-- Éléments de commande
INSERT INTO order_items (order_id, item_id, quantity) VALUES
(1, 1, 2),  -- Aurélien achète 2 chaussettes
(1, 2, 1),  -- Aurélien achète 1 mug
(2, 3, 1),  -- Claire achète 1 bonnet
(2, 4, 1);  -- Claire achète 1 plaid
