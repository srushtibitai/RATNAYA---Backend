import express from 'express';
import { getWishlist, syncWishlist, deleteWishlistItem, clearWishlist } from '../controllers/wishlistController.js';

const router = express.Router();

// GET /api/wishlist/:userId - Select Wishlist Items
router.get('/:userId', getWishlist);

// POST /api/wishlist/:userId - Insert / Sync Wishlist Items
router.post('/:userId', syncWishlist);

// DELETE /api/wishlist/:userId/item/:productId - Delete Single Item From Wishlist
router.delete('/:userId/item/:productId', deleteWishlistItem);

// DELETE /api/wishlist/:userId - Delete / Clear Entire Wishlist
router.delete('/:userId', clearWishlist);

export default router;
