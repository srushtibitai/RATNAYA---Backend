import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  owner: { type: String },
  email: { type: String },
  phone: { type: String },
  city: { type: String },
  rating: { type: Number, default: 4.8 },
  reviewsCount: { type: Number, default: 0 },
  productsCount: { type: Number, default: 0 },
  verified: { type: Boolean, default: true },
  joinedDate: { type: String },
  logo: { type: String },
  banner: { type: String },
  about: { type: String },
  gst: { type: String },
  pan: { type: String },
  bisLicense: { type: String },
  gstDoc: { type: String },
  panDoc: { type: String },
  bisDoc: { type: String },
  status: { type: String, default: 'Approved' },
  rejectionReason: { type: String, default: '' },
  commissionRate: { type: Number, default: 10 },
  createdAt: { type: Date, default: Date.now }
});

export const Seller = mongoose.models.Seller || mongoose.model('Seller', sellerSchema);
