require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// Routes
const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);

// ❗ Route 404 doit être définie à la fin, après les autres routes
app.use((req, res) => {
  res.status(404).json({ error: `Route non trouvée : ${req.originalUrl}` });
});

// Serveur
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveur lancé sur le port ${PORT}`));
