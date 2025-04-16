const express = require('express');
const cors = require('cors');
require('dotenv').config();

const itemsRoutes = require('./routes/items');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);
console.log('DB_HOST:', process.env.DB_HOST);


app.use(cors());
app.use(express.json());

app.use('/api/items', itemsRoutes);

app.listen(3000, '0.0.0.0', () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
