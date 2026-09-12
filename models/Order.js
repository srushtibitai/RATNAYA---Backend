import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  buyerName: { type: String },
  buyerEmail: { type: String },
  buyerPhone: { type: String },
  userId: { type: String },
  sellerId: { type: String },
  sellerName: { type: String },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: 'Processing' },
  trackingNumber: { type: String },
  items: { type: Array, default: [] },
  paymentMethod: { type: String, default: 'Razorpay / GPay' },
  paymentId: { type: String },
  address: { type: mongoose.Schema.Types.Mixed },
  returnReason: { type: String },
  rejectionReason: { type: String },
  createdAt: { type: Date, default: Date.now }
});

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
