import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, default: 'Home' },
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);
