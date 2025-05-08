const express = require('express');
const router = express.Router();
const { getAllItems, getItemById } = require('../controllers/itemController');

router.get('/', getAllItems);
router.get('/:id', getItemById);

module.exports = router;
