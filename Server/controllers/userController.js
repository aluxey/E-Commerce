const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Joi = require('joi');

const schema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email:    Joi.string().email().max(100).required(),
  password: Joi.string().min(8).max(255).required(),
  role:     Joi.string().valid('client', 'admin').default('client')
});

exports.register = async (req, res) => {
  // 1️⃣ Validation
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { username, email, password, role } = value;

  try {
    const hash = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email, hash, role]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(201).json({ token, user });
  } catch (err) {
    if (err.code === '23505') {
      const field = err.constraint.includes('email') ? 'email' : 'username';
      return res.status(409).json({ error: `${field} déjà utilisé` });
    }
    console.error(err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (rows.length === 0)
      return res.status(401).json({ error: "Identifiants invalides" });

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Identifiants invalides" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getUserById = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("❌ Aucun header Authorization");
    return res.status(401).json({ error: "Non autorisé" });
  }

  const token = authHeader.split(" ")[1];
  console.log("🪪 Token reçu dans /:id :", token);

  try {
    const { rows } = await db.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id=$1",
      [req.params.id]
    );

    if (rows.length === 0) {
      console.log("❌ Aucun utilisateur avec id", req.params.id);
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Erreur dans getUserById:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getCurrentUser = async (req, res) => {
  console.log("🔥 getCurrentUser appelée");

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log("❌ Aucun header Authorization");
    return res.status(401).json({ error: "Non autorisé" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      "SELECT id, username, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      console.log("❌ Aucun utilisateur trouvé avec l'id :", decoded.id);
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Erreur dans getCurrentUser:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const result = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur lors de la récupération des utilisateurs.' });
  }
};
