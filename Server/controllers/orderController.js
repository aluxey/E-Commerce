const db = require('../db');

exports.createOrder = async (req, res) => {
  const { user_id, items, shipping_address } = req.body;

  try {
    const order = await db.query(
      'INSERT INTO orders (user_id, shipping_address) VALUES ($1, $2) RETURNING id',
      [user_id, shipping_address]
    );

    const orderId = order.rows[0].id;

    for (let item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, item_id, quantity) VALUES ($1, $2, $3)',
        [orderId, item.id, item.quantity]
      );
    }

    res.status(201).json({ message: 'Commande créée', orderId });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const orderRes = await db.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Commande introuvable' });

    const itemsRes = await db.query(
      'SELECT oi.quantity, i.* FROM order_items oi JOIN item i ON i.id=oi.item_id WHERE oi.order_id=$1',
      [req.params.id]
    );

    res.json({ ...orderRes.rows[0], items: itemsRes.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Commande introuvable' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const result = await db.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Commande introuvable' });
    res.json({ message: 'Commande supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
      [req.params.userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
