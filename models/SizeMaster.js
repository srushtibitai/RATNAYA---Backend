import mongoose from 'mongoose';

const sizeMasterSchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  categoryName: { type: String, required: true },
  availableSizes: [{ type: String, required: true }],
  unit: { type: String, default: 'Standard' },
  createdAt: { type: Date, default: Date.now }
});

export const SizeMaster = mongoose.models.SizeMaster || mongoose.model('SizeMaster', sizeMasterSchema);
