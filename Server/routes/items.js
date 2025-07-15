const express = require('express');
const router = express.Router();
const {
  authenticateToken,
  authorizeAdmin,
} = require('../middlewares/auth');
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} = require('../controllers/itemController');

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', authenticateToken, authorizeAdmin, createItem);
router.put('/:id', authenticateToken, authorizeAdmin, updateItem);
router.delete('/:id', authenticateToken, authorizeAdmin, deleteItem);

module.exports = router;
