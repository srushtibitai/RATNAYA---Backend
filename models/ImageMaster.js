import mongoose from 'mongoose';

const imageMasterSchema = new mongoose.Schema({
  assetPath: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  title: { type: String },
  altText: { type: String },
  fileType: { type: String, default: 'image/jpeg' },
  createdAt: { type: Date, default: Date.now }
});

export const ImageMaster = mongoose.models.ImageMaster || mongoose.model('ImageMaster', imageMasterSchema);
