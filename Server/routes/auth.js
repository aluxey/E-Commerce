const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'votre_secret_de_dev';

// Simulé pour test (remplace par un SELECT si tu veux)
const adminUser = {
  id: 1,
  username: 'admin',
  password: 'admin123', // à remplacer par bcrypt dans une vraie app
  isAdmin: true
};

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === adminUser.username && password === adminUser.password) {
    const token = jwt.sign(
      { id: adminUser.id, username: adminUser.username, isAdmin: adminUser.isAdmin },
      SECRET,
      { expiresIn: '1h' }
    );

    return res.json({ token });
  }

  res.status(401).json({ error: 'Identifiants invalides' });
});

module.exports = router;
