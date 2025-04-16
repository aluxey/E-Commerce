-- Supprimer les anciennes données (juste au cas où)
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM users;
DELETE FROM item;

-- Items (produits)
INSERT INTO item (name, description, price, picture, quantity) VALUES
('Tapis en crochet', 'Tapis doux fait main en laine naturelle', 3500, 'https://example.com/tapis.jpg', 10),
('Bonnet en laine', 'Bonnet chaud pour l’hiver', 1200, 'https://example.com/bonnet.jpg', 15),
('Écharpe colorée', 'Écharpe arc-en-ciel tricotée avec amour', 1800, 'https://example.com/echarpe.jpg', 8);

-- Utilisateurs
INSERT INTO users (username,  role, email, password) VALUES
('aurelien', 'admin', 'aurelien@example.com', 'hashed_password_1'),
('ayrine', 'client', 'ayrine@example.com', 'hashed_password_2'),
('client_test', 'client', 'client@example.com', 'hashed_password_3');

-- Commandes
INSERT INTO orders (user_id, created_at) VALUES
(1, NOW()), -- commande d'aurelien
(2, NOW()); -- commande d'ayrine

-- Commande 1 : Aurelien achète 2 tapis et 1 bonnet
INSERT INTO order_items (order_id, item_id, quantity) VALUES
(1, 1, 2), -- 2 tapis
(1, 2, 1); -- 1 bonnet

-- Commande 2 : Ayrine achète 1 écharpe
INSERT INTO order_items (order_id, item_id, quantity) VALUES
(2, 3, 1); -- 1 écharpe


INSERT INTO users (email, password, role)
VALUES ('admin@site.com', SHA2('admin123', 256), 'admin');
