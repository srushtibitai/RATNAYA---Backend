import { SellerAd } from '../models/SellerAd.js';

/**
 * Automatically update expired ads status in DB
 */
async function autoExpireAds() {
  try {
    const now = new Date();
    await SellerAd.updateMany(
      { status: 'active', endDate: { $lt: now } },
      { $set: { status: 'expired' } }
    );
  } catch (err) {
    console.warn('Auto expire ads check warning:', err.message);
  }
}

/**
 * POST /api/seller-ads - Seller submits/creates a new Ad (Top Banner or Section)
 */
export async function createSellerAd(req, res) {
  try {
    const {
      sellerId,
      sellerName,
      sellerShopName,
      adType = 'top_banner',
      durationDays = 7,
      bannerSize = '1920x600',
      bannerSizeLabel,
      title,
      description,
      image,
      eyebrow,
      watermark,
      subtitle,
      badge,
      tag,
      targetCategory,
      targetLink,
      ctaPrimary,
      ctaSecondary,
      mainImage,
      accentImage,
      ringAccent,
      thumbnails,
      status: customStatus
    } = req.body;

    const primaryImg = mainImage || image;

    if (!sellerId || !title || !description || !primaryImg) {
      return res.status(400).json({
        success: false,
        message: 'Seller ID, Title, Description, and Main Image are required'
      });
    }

    const durationNum = [1, 7, 30].includes(Number(durationDays)) ? Number(durationDays) : 7;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationNum * 24 * 60 * 60 * 1000);

    // Calculate sample pricing based on duration
    const priceMap = { 1: 299, 7: 1499, 30: 4999 };
    const pricePaid = priceMap[durationNum] || 1499;

    // Size label map fallback
    const sizeLabelMap = {
      '1920x600': '1920 x 600 px (Top Hero Banner)',
      '1200x400': '1200 x 400 px (Royal Collection Section Banner)',
      '600x600': '600 x 600 px (Square Card / Sidebar Banner)'
    };
    const finalSizeLabel = bannerSizeLabel || sizeLabelMap[bannerSize] || '1920 x 600 px (Top Hero Banner)';

    const newAd = new SellerAd({
      sellerId,
      sellerName: sellerName || 'Jewellery Merchant',
      sellerShopName: sellerShopName || 'Royal House',
      adType: ['top_banner', 'section'].includes(adType) ? adType : 'top_banner',
      bannerSize: ['1920x600', '1200x400', '600x600'].includes(bannerSize) ? bannerSize : '1920x600',
      bannerSizeLabel: finalSizeLabel,
      durationDays: durationNum,
      startDate,
      endDate,
      status: customStatus && ['pending', 'active', 'rejected'].includes(customStatus) ? customStatus : 'pending',
      eyebrow: eyebrow || (adType === 'top_banner' ? 'FEATURED PROMO BANNER' : 'ROYAL COLLECTION AD'),
      watermark: watermark || 'VERIFIED SELLER',
      title,
      subtitle: subtitle || 'Exclusive Handcrafted Masterpiece',
      description,
      image: primaryImg,
      mainImage: primaryImg,
      accentImage: accentImage || primaryImg,
      ringAccent: ringAccent || '/assets/jewellery/hero/ringhero1.png',
      thumbnails: (Array.isArray(thumbnails) && thumbnails.length > 0) ? thumbnails : [primaryImg, primaryImg, primaryImg, primaryImg],
      badge: badge || (durationNum === 1 ? 'FLASH 1-DAY AD' : durationNum === 30 ? '30-DAY MEGA SPONSOR' : 'SPONSORED AD'),
      tag: tag || 'Seller Highlight',
      ctaPrimary: ctaPrimary || 'SHOP NOW',
      ctaSecondary: ctaSecondary || 'KNOW MORE',
      targetCategory: targetCategory || 'necklaces',
      targetLink: targetLink || '',
      pricePaid
    });

    await newAd.save();

    res.status(201).json({
      success: true,
      message: `Seller Ad successfully submitted! Pending Admin approval before appearing on Home Page.`,
      data: newAd
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating seller ad',
      error: error.message
    });
  }
}

/**
 * GET /api/seller-ads/all - Admin API to get all seller ads across platform
 */
export async function getAllSellerAdsAdmin(req, res) {
  try {
    await autoExpireAds();
    const { status } = req.query;

    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }

    const ads = await SellerAd.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching all seller ads for admin',
      error: error.message
    });
  }
}

/**
 * PUT /api/seller-ads/:id/approve - Admin approves a seller ad to make it live on Homepage
 */
export async function approveSellerAd(req, res) {
  try {
    const { id } = req.params;
    const ad = await SellerAd.findById(id);

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad banner not found' });
    }

    const durationNum = ad.durationDays || 7;
    const now = new Date();

    ad.status = 'active';
    ad.startDate = now;
    ad.endDate = new Date(now.getTime() + durationNum * 24 * 60 * 60 * 1000);
    ad.approvedAt = now;
    ad.approvedBy = 'Admin';
    ad.rejectionReason = '';

    await ad.save();

    res.json({
      success: true,
      message: 'Seller Ad Banner approved successfully and is now Live on Home Page!',
      data: ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error approving seller ad',
      error: error.message
    });
  }
}

/**
 * PUT /api/seller-ads/:id/reject - Admin rejects a seller ad
 */
export async function rejectSellerAd(req, res) {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const ad = await SellerAd.findById(id);

    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad banner not found' });
    }

    ad.status = 'rejected';
    ad.rejectionReason = reason || 'Does not meet marketplace banner design guidelines.';

    await ad.save();

    res.json({
      success: true,
      message: 'Seller Ad Banner rejected.',
      data: ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error rejecting seller ad',
      error: error.message
    });
  }
}

/**
 * GET /api/seller-ads/seller/:sellerId - Get all ads submitted by a specific seller
 */
export async function getSellerAds(req, res) {
  try {
    await autoExpireAds();
    const { sellerId } = req.params;

    const ads = await SellerAd.find({ sellerId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ads.length,
      data: ads
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching seller ads',
      error: error.message
    });
  }
}

/**
 * GET /api/seller-ads/active - Public API for Frontend to fetch active batch for a specific placement
 * Query Params: ?type=top_banner OR ?type=section
 * Rotation logic: Rotates to the next 3-ad batch every 3 minutes automatically!
 */
export async function getActiveBatchAds(req, res) {
  try {
    await autoExpireAds();

    // Auto-fix any active ads whose endDate was past when approved
    const now = new Date();
    await SellerAd.updateMany(
      { status: 'active', endDate: { $exists: false } },
      { $set: { endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } }
    );

    const requestedType = req.query.type;

    let filter = {
      status: 'active',
      endDate: { $gte: now }
    };

    if (requestedType === 'top_banner') {
      filter.$or = [
        { adType: 'top_banner' },
        { bannerSize: '1920x600' }
      ];
    } else if (requestedType === 'section') {
      filter.$or = [
        { adType: 'section' },
        { bannerSize: '1200x400' },
        { bannerSize: '600x600' }
      ];
    } else if (requestedType && requestedType !== 'all') {
      filter.adType = requestedType;
    }

    const activeAds = await SellerAd.find(filter).sort({ createdAt: -1 });
    const totalActiveCount = activeAds.length;

    if (totalActiveCount === 0) {
      return res.json({
        success: true,
        type: requestedType || 'section',
        totalActiveAds: 0,
        totalBatches: 0,
        currentBatchIndex: 0,
        nextRotationSeconds: 180,
        activeBatchAds: []
      });
    }

    const BATCH_SIZE = 3;
    const ROTATION_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes
    const currentMs = Date.now();
    const currentSlot = Math.floor(currentMs / ROTATION_INTERVAL_MS);

    const msIntoCurrentSlot = currentMs % ROTATION_INTERVAL_MS;
    const nextRotationSeconds = Math.ceil((ROTATION_INTERVAL_MS - msIntoCurrentSlot) / 1000);

    const totalBatches = Math.ceil(totalActiveCount / BATCH_SIZE);
    const currentBatchIndex = currentSlot % totalBatches;

    const startIndex = currentBatchIndex * BATCH_SIZE;
    const activeBatchAds = activeAds.slice(startIndex, startIndex + BATCH_SIZE);

    res.json({
      success: true,
      type: requestedType || 'section',
      totalActiveAds: totalActiveCount,
      totalBatches,
      currentBatchIndex,
      nextRotationSeconds,
      activeBatchAds,
      allActiveAds: activeAds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching active batch ads',
      error: error.message
    });
  }
}

/**
 * PUT /api/seller-ads/:id/status - Toggle seller ad status (active, paused)
 */
export async function toggleAdStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const ad = await SellerAd.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    if (['active', 'paused'].includes(status)) {
      ad.status = status;
      await ad.save();
    }

    res.json({
      success: true,
      message: `Ad status updated to ${ad.status}`,
      data: ad
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating ad status',
      error: error.message
    });
  }
}

/**
 * DELETE /api/seller-ads/:id - Delete a seller ad
 */
export async function deleteSellerAd(req, res) {
  try {
    const { id } = req.params;
    await SellerAd.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Seller ad deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting seller ad',
      error: error.message
    });
  }
}

