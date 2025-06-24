const db = require('../db');

exports.getAllItems = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM item');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getItemById = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM item WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.createItem = async (req, res) => {
  const { name, description, price, picture, quantity, category_id } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO item (name, description, price, picture, quantity, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, picture, quantity, category_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateItem = async (req, res) => {
  const { name, description, price, picture, quantity, category_id } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE item SET name=$1, description=$2, price=$3, picture=$4, quantity=$5, category_id=$6, updated_at=NOW() WHERE id=$7 RETURNING *',
      [name, description, price, picture, quantity, category_id, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Item introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM item WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Item introuvable' });
    res.json({ message: 'Item supprimé' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
