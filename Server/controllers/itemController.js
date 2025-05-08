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
