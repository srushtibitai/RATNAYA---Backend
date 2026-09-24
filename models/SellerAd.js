import mongoose from 'mongoose';

const sellerAdSchema = new mongoose.Schema(
  {
    sellerId: { type: String, required: true, index: true },
    sellerName: { type: String, default: 'Ratnaya Gold Seller' },
    sellerShopName: { type: String, default: 'Luxury Jewels' },
    adType: {
      type: String,
      enum: ['top_banner', 'section'],
      default: 'top_banner',
      index: true
    },
    durationDays: {
      type: Number,
      enum: [1, 7, 30],
      default: 7
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'active', 'rejected', 'expired', 'paused'],
      default: 'pending',
      index: true
    },
    bannerSize: {
      type: String,
      enum: ['1920x600', '1200x400', '600x600'],
      default: '1920x600'
    },
    bannerSizeLabel: {
      type: String,
      default: '1920 x 600 px (Top Hero Banner)'
    },
    rejectionReason: { type: String, default: '' },
    approvedAt: { type: Date },
    approvedBy: { type: String, default: '' },
    eyebrow: { type: String, default: 'PROMOTIONAL AD' },
    watermark: { type: String, default: 'VERIFIED SELLER' },
    title: { type: String, required: true },
    subtitle: { type: String, default: 'Exclusive Offer From Verified Seller' },
    description: { type: String, required: true },
    image: { type: String, required: true }, // fallback primary image
    mainImage: { type: String, default: '' },
    accentImage: { type: String, default: '' },
    ringAccent: { type: String, default: '' },
    thumbnails: [{ type: String }], // Array of 4 sub-thumbnails for Hero Slider
    badge: { type: String, default: 'SPONSORED AD' },
    tag: { type: String, default: 'Seller Promotion' },
    ctaPrimary: { type: String, default: 'SHOP NOW' },
    ctaSecondary: { type: String, default: 'KNOW MORE' },
    targetCategory: { type: String, default: 'necklaces' },
    targetLink: { type: String, default: '' },
    pricePaid: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const SellerAd = mongoose.models.SellerAd || mongoose.model('SellerAd', sellerAdSchema);
