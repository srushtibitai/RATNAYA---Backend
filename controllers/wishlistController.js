import { Wishlist } from '../models/Wishlist.js';

/**
 * GET /api/wishlist/:userId - Select Wishlist Items
 */
export async function getWishlist(req, res) {
  try {
    const { userId } = req.params;
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [] });
      await wishlist.save();
    }
    res.json({ success: true, data: wishlist.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching wishlist items', error: error.message });
  }
}

/**
 * POST /api/wishlist/:userId - Insert / Sync Wishlist Items
 */
export async function syncWishlist(req, res) {
  try {
    const { userId } = req.params;
    const { items } = req.body;
    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: items || [] });
    } else {
      wishlist.items = items || [];
    }
    await wishlist.save();
    res.json({ success: true, message: 'Wishlist updated successfully', data: wishlist.items });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating wishlist', error: error.message });
  }
}

/**
 * DELETE /api/wishlist/:userId/item/:productId - Delete Single Item From Wishlist
 */
export async function deleteWishlistItem(req, res) {
  try {
    const { userId, productId } = req.params;
    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = wishlist.items.filter((item) => item.productId !== productId && item._id.toString() !== productId);
      await wishlist.save();
    }
    res.json({ success: true, message: 'Item deleted from wishlist', data: wishlist ? wishlist.items : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing item from wishlist', error: error.message });
  }
}

/**
 * DELETE /api/wishlist/:userId - Delete / Clear Entire Wishlist
 */
export async function clearWishlist(req, res) {
  try {
    const { userId } = req.params;
    let wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.items = [];
      await wishlist.save();
    }
    res.json({ success: true, message: 'Wishlist cleared successfully', data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing wishlist', error: error.message });
  }
}
