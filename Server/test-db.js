// Server/test-db.js
require('dotenv').config();
const db = require('./db');

(async () => {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('Connexion réussie :', result.rows[0]);
  } catch (e) {
    console.error('Erreur de connexion à la BDD :', e);
  }
})();
