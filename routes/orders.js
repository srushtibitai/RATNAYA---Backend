import express from 'express';
import {
  getAllOrders,
  getBuyerOrders,
  getSellerOrders,
  createOrder,
  requestOrderReturn,
  updateOrderStatus,
  processOrderRefund,
  cancelOrder,
  deleteOrder
} from '../controllers/orderController.js';
import { verifyToken, optionalToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/orders/buyer/my-orders - Select Logged-in Buyer Orders (Buyer Scoped)
router.get('/buyer/my-orders', optionalToken, getBuyerOrders);

// GET /api/orders/seller/my-orders - Select Logged-in Seller Orders (Seller Scoped)
router.get('/seller/my-orders', optionalToken, getSellerOrders);

// GET /api/orders - Select All Orders (Admin / General)
router.get('/', optionalToken, getAllOrders);

// POST /api/orders - Insert Order at Checkout & Send Confirmation Email
router.post('/', optionalToken, createOrder);

// POST /api/orders/:id/return - Buyer Request Order Return & Send Email to Seller
router.post('/:id/return', optionalToken, requestOrderReturn);

// PUT /api/orders/:id/status - Update Order Status & Send Shipping Email
router.put('/:id/status', optionalToken, updateOrderStatus);

// PUT /api/orders/:id/refund - Approve Return & Process Refund, Send Email
router.put('/:id/refund', optionalToken, processOrderRefund);

// PUT /api/orders/:id/cancel - Cancel Order
router.put('/:id/cancel', optionalToken, cancelOrder);

// DELETE /api/orders/:id - Delete Order Record
router.delete('/:id', optionalToken, deleteOrder);

export default router;
