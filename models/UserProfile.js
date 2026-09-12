import mongoose from 'mongoose';

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    dob: { type: String, default: '' },
    anniversary: { type: String, default: '' },
    vipBadge: { type: String, default: 'Ratnaya VIP Gold Connoisseur' }
  },
  { timestamps: true }
);

export const UserProfile =
  mongoose.models.UserProfile || mongoose.model('UserProfile', userProfileSchema);
