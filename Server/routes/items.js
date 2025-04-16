const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');


// Récupérer tous les items
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM item');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des items' });
  }
});

// Retourne un item par son id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM item WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du produit' });
  }
});

// Modifie un item
// Vérifie si l'utilisateur est authentifié et admin
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, picture, quantity } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE item SET name = ?, description = ?, price = ?, picture = ?, quantity = ? WHERE id = ?',
      [name, description, price, picture, quantity, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit mis à jour' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la modification du produit' });
  }
});

// Supprime un item
// Vérifie si l'utilisateur est authentifié et admin
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM item WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    res.json({ message: 'Produit supprimé' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du produit' });
  }
});

router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  const { name, description, price, picture, quantity } = req.body;

  try {
    const [result] = await db.query(
      'INSERT INTO item (name, description, price, picture, quantity) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, picture, quantity]
    );

    res.status(201).json({ message: 'Produit ajouté', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de l\'ajout du produit' });
  }
});



module.exports = router;
