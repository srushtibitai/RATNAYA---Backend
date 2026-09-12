import mongoose from 'mongoose';

const bannerSchema = new mongoose.Schema(
  {
    slideId: { type: Number, default: 1 },
    eyebrow: { type: String, default: 'TIMELESS SOPHISTICATION' },
    watermark: { type: String, default: 'INCOMPARABLE' },
    title: { type: String, required: true },
    description: { type: String, required: true },
    mainImage: { type: String, required: true },
    ringAccent: { type: String, default: '/assets/jewellery/hero/ringhero1.png' },
    accentImage: { type: String, default: '/assets/jewellery/hero/rightside1.jpg' },
    targetCategory: { type: String, default: 'all' },
    buttonText: { type: String, default: 'KNOW MORE' },
    thumbnails: [{ type: String }]
  },
  { timestamps: true }
);

export const Banner = mongoose.models.Banner || mongoose.model('Banner', bannerSchema);
