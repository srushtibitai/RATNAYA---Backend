import express from 'express';
import {
  getPendingSellers,
  approveSeller,
  rejectSeller,
  getPendingProducts,
  adminApproveProduct,
  getCommission,
  updateCommission,
  getGstRate,
  updateGstRate
} from '../controllers/adminController.js';
import { verifyToken, optionalToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/admin/sellers/pending - Select Pending Sellers
router.get('/sellers/pending', optionalToken, getPendingSellers);

// PUT /api/admin/sellers/:id/approve - Approve Seller Account
router.put('/sellers/:id/approve', optionalToken, approveSeller);

// PUT /api/admin/sellers/:id/reject - Reject Seller Account & Send Mail
router.put('/sellers/:id/reject', optionalToken, rejectSeller);

// GET /api/admin/products/pending - Select Pending Products
router.get('/products/pending', optionalToken, getPendingProducts);

// PUT /api/admin/products/:id/approve - Approve Product
router.put('/products/:id/approve', optionalToken, adminApproveProduct);

// GET /api/admin/commission - Select Global Commission
router.get('/commission', optionalToken, getCommission);

// PUT /api/admin/commission - Update Global Commission
router.put('/commission', optionalToken, updateCommission);

// GET /api/admin/gst - Select Global GST Rate %
router.get('/gst', optionalToken, getGstRate);

// PUT /api/admin/gst - Update Global GST Rate %
router.put('/gst', optionalToken, updateGstRate);

export default router;
