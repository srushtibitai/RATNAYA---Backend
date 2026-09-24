import express from 'express';
import {
  createSellerAd,
  getSellerAds,
  getActiveBatchAds,
  toggleAdStatus,
  deleteSellerAd,
  getAllSellerAdsAdmin,
  approveSellerAd,
  rejectSellerAd
} from '../controllers/sellerAdController.js';

const router = express.Router();

// GET /api/seller-ads/all - Admin route to list all seller ads
router.get('/all', getAllSellerAdsAdmin);

// GET /api/seller-ads/active - Public API for 3-minute 3-ad batch rotation
router.get('/active', getActiveBatchAds);

// GET /api/seller-ads/seller/:sellerId - Get all ads of a seller
router.get('/seller/:sellerId', getSellerAds);

// POST /api/seller-ads - Create/Submit new seller ad
router.post('/', createSellerAd);

// PUT /api/seller-ads/:id/approve - Admin approve seller ad
router.put('/:id/approve', approveSellerAd);

// PUT /api/seller-ads/:id/reject - Admin reject seller ad
router.put('/:id/reject', rejectSellerAd);

// PUT /api/seller-ads/:id/status - Toggle seller ad status
router.put('/:id/status', toggleAdStatus);

// DELETE /api/seller-ads/:id - Delete seller ad
router.delete('/:id', deleteSellerAd);

export default router;
