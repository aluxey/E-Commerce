const db = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email",
      [username, email, hash]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
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

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, username, email, role, created_at FROM users WHERE id=$1",
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
