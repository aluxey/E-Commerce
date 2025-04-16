const express = require('express');
const cors = require('cors');
require('dotenv').config();

const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/items', itemsRoutes);

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Serveur démarré sur ${process.env.DB_HOST}');
});
