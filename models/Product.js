import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  sku: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String, required: true, index: true },
  categoryName: { type: String, required: true },
  sellerId: { type: String, required: true, index: true },
  sellerName: { type: String, required: true },
  sellerRating: { type: Number, default: 4.8 },
  price: { type: Number, required: true, index: true },
  originalPrice: { type: Number },
  discountPercent: { type: Number, default: 0 },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 },
  isNew: { type: Boolean, default: false },
  isBestSeller: { type: Boolean, default: false },
  stock: { type: Number, default: 5 },
  metal: { type: String, index: true },
  purity: { type: String },
  weight: { type: String },
  gemstone: { type: String },
  material: { type: String },
  color: { type: String },
  size: { type: String },
  availableSizes: [{ type: String, index: true }],
  images: [{ type: String }],
  specifications: [{
    label: { type: String },
    value: { type: String }
  }],
  description: { type: String },
  approvalStatus: { type: String, default: 'Approved', index: true },
  rejectionReason: { type: String },
  rejectedAt: { type: Date },
  resubmittedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { suppressReservedKeysWarning: true });

export const Product = mongoose.models.Product || mongoose.model('Product', productSchema);
