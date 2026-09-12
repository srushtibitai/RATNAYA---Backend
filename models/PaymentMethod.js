import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    type: { type: String, required: true }, // e.g. "Visa Credit Card", "Mastercard", "UPI ID"
    bank: { type: String, required: true },
    number: { type: String, required: true }, // e.g. "•••• •••• •••• 4291"
    expiry: { type: String, default: 'N/A' },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const PaymentMethod =
  mongoose.models.PaymentMethod || mongoose.model('PaymentMethod', paymentMethodSchema);
