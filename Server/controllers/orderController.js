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
