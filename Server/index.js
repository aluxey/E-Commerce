require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const itemRoutes = require('./routes/items');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');

app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Serveur sur le port ${PORT}`));
