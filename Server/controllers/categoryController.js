const db = require('../db');

exports.getAllCategories = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM category ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
