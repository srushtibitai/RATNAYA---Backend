import express from 'express';
import { getCart, syncCart, deleteCartItem, clearCart } from '../controllers/cartController.js';

const router = express.Router();

// GET /api/cart/:userId - Select Cart Items
router.get('/:userId', getCart);

// POST /api/cart/:userId - Insert / Sync Cart Items
router.post('/:userId', syncCart);

// DELETE /api/cart/:userId/item/:productId - Delete Single Item From Cart
router.delete('/:userId/item/:productId', deleteCartItem);

// DELETE /api/cart/:userId - Delete / Clear Entire Cart
router.delete('/:userId', clearCart);

export default router;
