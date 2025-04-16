const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'votre_secret_de_dev';

// Middleware pour vérifier le token
function isAuthenticated(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Token manquant' });

  const token = authHeader.split(' ')[1]; // format: Bearer xxx
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded; // injecte le user dans req.user
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide' });
  }
}

// Vérifie si admin
function isAdmin(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Accès admin requis' });
  }
  next();
}

module.exports = { isAuthenticated, isAdmin };
