import express from 'express';
import {
  getSellers,
  getSellerById,
  addSeller,
  updateSellerCommission,
  registerSeller,
  updateSellerProfile,
  verifySellerDocument
} from '../controllers/sellerController.js';
import { verifyToken, optionalToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/sellers - Select Verified Sellers
router.get('/', getSellers);

// POST /api/sellers/verify-document - Public / Seller Verify GST, PAN & BIS License
router.post('/verify-document', verifySellerDocument);

// GET /api/sellers/:id - Select Specific Seller Store Profile
router.get('/:id', getSellerById);

// POST /api/sellers/add - Admin Add Seller
router.post('/add', optionalToken, addSeller);

// PUT /api/sellers/:id/commission - Admin Update Commission
router.put('/:id/commission', optionalToken, updateSellerCommission);

// POST /api/sellers/register - Public Seller Registration
router.post('/register', registerSeller);

// PUT /api/sellers/:id/profile - Seller Update Store Profile
router.put('/:id/profile', optionalToken, updateSellerProfile);

export default router;
