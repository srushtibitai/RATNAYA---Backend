import { Cart } from '../models/Cart.js';

/**
 * GET /api/cart/:userId - Select Cart Items
 */
export async function getCart(req, res) {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
      await cart.save();
    }
    res.json({ success: true, data: cart.items });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart items', error: error.message });
  }
}

/**
 * POST /api/cart/:userId - Insert / Sync Cart Items
 */
export async function syncCart(req, res) {
  try {
    const { userId } = req.params;
    const { items } = req.body;
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: items || [] });
    } else {
      cart.items = items || [];
    }
    await cart.save();
    res.json({ success: true, message: 'Cart updated successfully', data: cart.items });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating cart', error: error.message });
  }
}

/**
 * DELETE /api/cart/:userId/item/:productId - Delete Single Item From Cart
 */
export async function deleteCartItem(req, res) {
  try {
    const { userId, productId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter((item) => item.productId !== productId && item._id.toString() !== productId);
      await cart.save();
    }
    res.json({ success: true, message: 'Item deleted from cart', data: cart ? cart.items : [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing item from cart', error: error.message });
  }
}

/**
 * DELETE /api/cart/:userId - Delete / Clear Entire Cart
 */
export async function clearCart(req, res) {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared successfully', data: [] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
}
