const db = require('../db');

exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM category ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM category WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await db.query('INSERT INTO category (name) VALUES ($1) RETURNING *', [name]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  try {
    const { rows } = await db.query('UPDATE category SET name=$1 WHERE id=$2 RETURNING *', [name, req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM category WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Catégorie introuvable' });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
