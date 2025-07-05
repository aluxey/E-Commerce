require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(express.json());

app.use(cors());

const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const categoryRoutes = require('./routes/categories');

app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);
app.use('/categories', categoryRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));
app.use((req, res) => {
  res.status(404).json({ error: `Route non trouvée : ${req.originalUrl}` });
});
