import mongoose from 'mongoose';

const wishlistItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  sellerName: { type: String },
  category: { type: String }
});

const wishlistSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    items: [wishlistItemSchema]
  },
  { timestamps: true }
);

export const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
