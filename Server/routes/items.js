const express = require('express');
const router = express.Router();
const db = require('../db');

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

module.exports = router;
