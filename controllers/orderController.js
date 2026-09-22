import { db } from '../db/database.js';
import { isMongoReady } from '../config/db.js';
import { Seller } from '../models/Seller.js';
import { Order } from '../models/Order.js';
import {
  sendOrderConfirmationEmail,
  sendOrderShippedEmail,
  sendReturnRequestToSellerEmail,
  sendRefundCompletedEmail
} from '../services/emailService.js';

const INITIAL_DEMO_ORDERS = [
  {
    id: 'RAT-ORD-91054',
    date: '2026-09-22',
    buyerName: 'Aarti Kapoor',
    buyerEmail: 'aarti.kapoor@gmail.com',
    buyerPhone: '+91 98765 43210',
    totalAmount: 175000,
    status: 'Order Requested',
    trackingNumber: 'PENDING-SELLER-ACCEPTANCE',
    sellerName: 'Kundan Jewels Jaipur',
    sellerId: 'seller-1',
    items: [
      { productId: 'prod-req-101', name: '22K Gold Antique Choker Necklace', price: 175000, qty: 1, sellerName: 'Kundan Jewels Jaipur', sellerId: 'seller-1' }
    ],
    paymentMethod: 'Prepaid (UPI / Card)',
    address: 'B-204, Royal Palms, C-Scheme, Jaipur 302001'
  },
  {
    id: 'RAT-ORD-88219',
    date: '2026-08-28',
    buyerName: 'Priya Malhotra',
    buyerEmail: 'priya.m@gmail.com',
    buyerPhone: '+91 98201 44510',
    totalAmount: 245000,
    status: 'Delivered',
    trackingNumber: 'BLUEDART-8891230',
    sellerName: 'Heritage Gold Kolkata',
    items: [
      { productId: 'prod-1', name: 'Gold Bangle Pair', price: 142000, qty: 1, sellerName: 'Heritage Gold Kolkata' }
    ],
    paymentMethod: 'UPI (GPay)',
    address: 'Flat 402, Sea Pearl Towers, Worli, Mumbai 400018'
  },
  {
    id: 'RAT-ORD-90142',
    date: '2026-09-02',
    buyerName: 'Priya Malhotra',
    buyerEmail: 'priya.m@gmail.com',
    buyerPhone: '+91 98201 44510',
    totalAmount: 125000,
    status: 'Shipped',
    trackingNumber: 'BLUEDART-9921401',
    sellerName: 'Kundan Jewels Jaipur',
    items: [
      { productId: 'prod-er-1', name: 'Royal Kundan & Pearl Chandbali Earrings', price: 125000, qty: 1, sellerName: 'Kundan Jewels Jaipur' }
    ],
    paymentMethod: 'Credit Card (HDFC)',
    address: 'Flat 402, Sea Pearl Towers, Worli, Mumbai 400018'
  }
];

// Helper to resolve seller email
async function resolveSellerEmail(sellerId, sellerName, localStore) {
  if (isMongoReady()) {
    try {
      const mongoSeller = await Seller.findOne({ $or: [{ id: sellerId }, { name: sellerName }] }).lean();
      if (mongoSeller && mongoSeller.email) return mongoSeller.email;
    } catch (e) {}
  }
  const storeSeller = (localStore?.sellers || []).find((s) => s.id === sellerId || s.name === sellerName);
  return storeSeller?.email || null;
}

/**
 * GET /api/orders (Select All Orders - Admin / General)
 */
export async function getAllOrders(req, res) {
  if (isMongoReady()) {
    try {
      let mongoOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
      if (mongoOrders.length === 0) {
        await Order.insertMany(INITIAL_DEMO_ORDERS);
        mongoOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
      }
      return res.json({ success: true, database: 'MongoDB', data: mongoOrders });
    } catch (err) {
      console.warn('MongoDB Orders Fetch Error:', err.message);
    }
  }

  const store = db.read();
  if (!store.orders || store.orders.length === 0) {
    store.orders = INITIAL_DEMO_ORDERS;
    db.write(store);
  }
  res.json({ success: true, database: 'Memory Store', data: store.orders || [] });
}

/**
 * GET /api/orders/buyer/my-orders (Select Buyer Scoped Orders)
 */
export async function getBuyerOrders(req, res) {
  const buyerEmail = req.user?.email;
  const buyerId = req.user?.id;

  if (isMongoReady()) {
    try {
      let mongoOrders = await Order.find({
        $or: [
          { buyerEmail: buyerEmail },
          { userId: buyerId },
          { buyerEmail: { $exists: false } }
        ]
      }).sort({ createdAt: -1 }).lean();

      if (mongoOrders.length === 0 && !buyerEmail) {
        mongoOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
      }
      return res.json({ success: true, database: 'MongoDB', data: mongoOrders });
    } catch (err) {
      console.warn('MongoDB Buyer Orders Fetch Error:', err.message);
    }
  }

  const store = db.read();
  if (!store.orders || store.orders.length === 0) {
    store.orders = INITIAL_DEMO_ORDERS;
    db.write(store);
  }

  const buyerOrders = (store.orders || []).filter(
    (o) => o.buyerEmail === buyerEmail || o.userId === buyerId || !buyerEmail
  );

  res.json({ success: true, database: 'Memory Store', data: buyerOrders });
}

/**
 * GET /api/orders/seller/my-orders (Select Seller Scoped Orders)
 */
export async function getSellerOrders(req, res) {
  const sellerId = req.query?.sellerId || req.user?.sellerId || req.user?.id;
  const sellerName = req.query?.sellerName || req.user?.name || req.user?.businessName;

  if (isMongoReady()) {
    try {
      let queryCond = [];
      if (sellerId) {
        queryCond.push({ sellerId: sellerId }, { 'items.sellerId': sellerId });
      }
      if (sellerName) {
        queryCond.push({ sellerName: sellerName }, { 'items.sellerName': sellerName });
      }

      let mongoOrders = [];
      if (queryCond.length > 0) {
        mongoOrders = await Order.find({ $or: queryCond }).sort({ createdAt: -1 }).lean();
      } else {
        mongoOrders = await Order.find({}).sort({ createdAt: -1 }).lean();
      }

      return res.json({ success: true, database: 'MongoDB', data: mongoOrders });
    } catch (err) {
      console.warn('MongoDB Seller Orders Fetch Error:', err.message);
    }
  }

  const store = db.read();
  if (!store.orders || store.orders.length === 0) {
    store.orders = INITIAL_DEMO_ORDERS;
    db.write(store);
  }

  const sellerOrders = (store.orders || []).filter((o) => {
    if (!sellerId && !sellerName) return true;
    if (sellerId && (o.sellerId === sellerId || o.items?.some((i) => i.sellerId === sellerId))) return true;
    if (sellerName && (o.sellerName === sellerName || o.items?.some((i) => i.sellerName === sellerName))) return true;
    return false;
  });

  res.json({ success: true, database: 'Memory Store', data: sellerOrders });
}

/**
 * POST /api/orders (Insert Order at Checkout)
 */
export async function createOrder(req, res) {
  const newOrder = {
    id: `RAT-ORD-${Math.floor(10000 + Math.random() * 90000)}`,
    date: new Date().toISOString().split('T')[0],
    status: req.body.status || 'Order Requested',
    trackingNumber: 'PENDING-SELLER-ACCEPTANCE',
    userId: req.user?.id || null,
    buyerEmail: req.body.buyerEmail || req.user?.email || 'customer@ratnaya.com',
    ...req.body
  };

  if (isMongoReady()) {
    try {
      const createdMongoOrder = await Order.create(newOrder);
      sendOrderConfirmationEmail(createdMongoOrder);
      return res.status(201).json({
        success: true,
        database: 'MongoDB',
        message: 'Royal order placed successfully in MongoDB',
        data: createdMongoOrder
      });
    } catch (err) {
      console.warn('MongoDB Create Order Error:', err.message);
    }
  }

  const store = db.read();
  store.orders = store.orders || [];
  store.orders.unshift(newOrder);
  db.write(store);

  // Send Order Confirmation Email via Nodemailer
  sendOrderConfirmationEmail(newOrder);

  res.status(201).json({ success: true, database: 'Memory Store', message: 'Royal order placed successfully', data: newOrder });
}

/**
 * POST /api/orders/:id/return (Buyer Requests Order Return)
 */
export async function requestOrderReturn(req, res) {
  const { reason, comments, refundMethod, bankDetails, upiId } = req.body;
  const returnDetails = {
    requestDate: new Date().toISOString().split('T')[0],
    reason: reason || 'Not Specified',
    comments: comments || '',
    refundMethod: refundMethod || 'Original Payment Source',
    bankDetails: bankDetails || null,
    upiId: upiId || null,
    status: 'Pending Approval'
  };

  if (isMongoReady()) {
    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { id: req.params.id },
        { status: 'Return Requested', returnDetails },
        { returnDocument: 'after' }
      ).lean();

      if (updatedOrder) {
        const firstItem = (updatedOrder.items && updatedOrder.items[0]) || {};
        const sellerEmail = firstItem.sellerEmail || await resolveSellerEmail(firstItem.sellerId || updatedOrder.sellerId, firstItem.sellerName || updatedOrder.sellerName, null);
        sendReturnRequestToSellerEmail({ sellerEmail, order: updatedOrder, returnDetails });

        return res.json({
          success: true,
          database: 'MongoDB',
          message: 'Return request submitted successfully. Our quality team will review it within 24 hours.',
          data: updatedOrder
        });
      }
    } catch (err) {
      console.warn('MongoDB Order Return Error:', err.message);
    }
  }

  const store = db.read();
  const order = (store.orders || []).find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = 'Return Requested';
  order.returnDetails = returnDetails;
  db.write(store);

  const firstItem = (order.items && order.items[0]) || {};
  const sellerEmail = firstItem.sellerEmail || await resolveSellerEmail(firstItem.sellerId || order.sellerId, firstItem.sellerName || order.sellerName, store);

  sendReturnRequestToSellerEmail({ sellerEmail, order, returnDetails: order.returnDetails });

  res.json({
    success: true,
    database: 'Memory Store',
    message: 'Return request submitted successfully. Our quality team will review it within 24 hours.',
    data: order
  });
}

/**
 * PUT /api/orders/:id/status (Update Order Status)
 */
export async function updateOrderStatus(req, res) {
  const newStatus = req.body.status;
  const trackingNumber = req.body.trackingNumber;

  if (isMongoReady()) {
    try {
      const updatePayload = {};
      if (newStatus) updatePayload.status = newStatus;
      if (trackingNumber) updatePayload.trackingNumber = trackingNumber;

      const updatedOrder = await Order.findOneAndUpdate(
        { id: req.params.id },
        { $set: updatePayload },
        { returnDocument: 'after' }
      ).lean();

      if (updatedOrder) {
        if (newStatus === 'Shipped' || newStatus === 'In Transit') {
          sendOrderShippedEmail(updatedOrder);
        }
        return res.json({ success: true, database: 'MongoDB', data: updatedOrder });
      }
    } catch (err) {
      console.warn('MongoDB Order Status Update Error:', err.message);
    }
  }

  const store = db.read();
  const order = (store.orders || []).find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const oldStatus = order.status;
  order.status = newStatus || order.status;
  if (trackingNumber) order.trackingNumber = trackingNumber;

  db.write(store);

  if (newStatus === 'Shipped' || newStatus === 'In Transit' || (oldStatus !== 'Shipped' && newStatus === 'Shipped')) {
    sendOrderShippedEmail(order);
  }

  res.json({ success: true, database: 'Memory Store', data: order });
}

/**
 * PUT /api/orders/:id/refund (Approve Return & Process Refund)
 */
export async function processOrderRefund(req, res) {
  const refundTxnId = `RFND-${Math.floor(10000000 + Math.random() * 90000000)}`;
  const refundDate = new Date().toISOString().split('T')[0];

  if (isMongoReady()) {
    try {
      const existing = await Order.findOne({ id: req.params.id }).lean();
      if (existing) {
        const refundAmount = req.body.refundAmount || existing.totalAmount || 0;
        const refundDetails = {
          refundAmount,
          refundTxnId,
          refundDate,
          status: 'Completed',
          notes: req.body.notes || 'Full refund processed to original/nominated account.'
        };

        const updatedOrder = await Order.findOneAndUpdate(
          { id: req.params.id },
          {
            $set: {
              status: 'Refunded',
              refundDetails,
              'returnDetails.status': 'Approved & Refunded'
            }
          },
          { returnDocument: 'after' }
        ).lean();

        sendRefundCompletedEmail(updatedOrder);
        return res.json({
          success: true,
          database: 'MongoDB',
          message: `Refund of ₹${refundAmount.toLocaleString('en-IN')} processed successfully!`,
          data: updatedOrder
        });
      }
    } catch (err) {
      console.warn('MongoDB Refund Error:', err.message);
    }
  }

  const store = db.read();
  const order = (store.orders || []).find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const refundAmount = req.body.refundAmount || order.totalAmount || 0;
  order.status = 'Refunded';
  order.refundDetails = {
    refundAmount,
    refundTxnId,
    refundDate,
    status: 'Completed',
    notes: req.body.notes || 'Full refund processed to original/nominated account.'
  };

  if (order.returnDetails) {
    order.returnDetails.status = 'Approved & Refunded';
  }

  db.write(store);
  sendRefundCompletedEmail(order);

  res.json({
    success: true,
    database: 'Memory Store',
    message: `Refund of ₹${refundAmount.toLocaleString('en-IN')} processed successfully!`,
    data: order
  });
}

/**
 * PUT /api/orders/:id/cancel (Cancel Order)
 */
export async function cancelOrder(req, res) {
  if (isMongoReady()) {
    try {
      const updatedOrder = await Order.findOneAndUpdate(
        { id: req.params.id },
        {
          $set: {
            status: 'Cancelled',
            cancellationReason: req.body.reason || 'Cancelled by buyer',
            cancelledAt: new Date().toISOString().split('T')[0]
          }
        },
        { returnDocument: 'after' }
      ).lean();

      if (updatedOrder) {
        return res.json({ success: true, database: 'MongoDB', message: 'Order cancelled successfully', data: updatedOrder });
      }
    } catch (err) {
      console.warn('MongoDB Cancel Order Error:', err.message);
    }
  }

  const store = db.read();
  const order = (store.orders || []).find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.status = 'Cancelled';
  order.cancellationReason = req.body.reason || 'Cancelled by buyer';
  order.cancelledAt = new Date().toISOString().split('T')[0];

  db.write(store);
  res.json({ success: true, database: 'Memory Store', message: 'Order cancelled successfully', data: order });
}

/**
 * DELETE /api/orders/:id (Delete Order)
 */
export async function deleteOrder(req, res) {
  if (isMongoReady()) {
    try {
      const deleted = await Order.findOneAndDelete({ id: req.params.id });
      if (deleted) {
        return res.json({ success: true, database: 'MongoDB', message: 'Order record deleted successfully' });
      }
    } catch (err) {
      console.warn('MongoDB Delete Order Error:', err.message);
    }
  }

  const store = db.read();
  const initialLength = (store.orders || []).length;
  store.orders = (store.orders || []).filter((o) => o.id !== req.params.id);

  if (store.orders.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  db.write(store);
  res.json({ success: true, database: 'Memory Store', message: 'Order record deleted successfully' });
}
