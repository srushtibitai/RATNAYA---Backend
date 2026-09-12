import mongoose from 'mongoose';

const specificationMasterSchema = new mongoose.Schema({
  label: { type: String, required: true, unique: true },
  category: { type: String, default: 'General' },
  options: [{ type: String }],
  isFilterable: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const SpecificationMaster = mongoose.models.SpecificationMaster || mongoose.model('SpecificationMaster', specificationMasterSchema);
