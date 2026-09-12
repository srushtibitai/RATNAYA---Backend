import express from 'express';
import {
  getAllProducts,
  getSellerProducts,
  getProductById,
  createProduct,
  updateProduct,
  approveProduct,
  rejectProduct,
  deleteProduct
} from '../controllers/productController.js';
import { verifyToken, optionalToken, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/products/seller/my-products - Select Logged-in Seller Products (Seller Scoped)
router.get('/seller/my-products', verifyToken, authorizeRoles('SELLER', 'ADMIN'), getSellerProducts);

// GET /api/products - Select Public Catalog
router.get('/', optionalToken, getAllProducts);

// GET /api/products/:id - Select Specific Product
router.get('/:id', optionalToken, getProductById);

// POST /api/products - Insert Seller Product Listing
router.post('/', verifyToken, authorizeRoles('SELLER', 'ADMIN'), createProduct);

// PUT /api/products/:id - Update Seller Product Details
router.put('/:id', verifyToken, authorizeRoles('SELLER', 'ADMIN'), updateProduct);

// PUT /api/products/:id/approve - Admin Approve Product
router.put('/:id/approve', optionalToken, approveProduct);

// PUT /api/products/:id/reject - Admin Reject Product & Send Mail
router.put('/:id/reject', optionalToken, rejectProduct);

// DELETE /api/products/:id - Delete Product Listing
router.delete('/:id', optionalToken, deleteProduct);

export default router;
