import express from 'express';
import {
  getMasterCategories,
  getMasterSizes,
  addMasterSize,
  getMasterSpecifications,
  addMasterSpecification,
  getMasterImages,
  addMasterImage,
  getMasterSellers,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod
} from '../controllers/masterController.js';

const router = express.Router();

// GET /api/masters/categories - Select Category Masters
router.get('/categories', getMasterCategories);

// GET /api/masters/sizes - Select Size Masters
router.get('/sizes', getMasterSizes);

// POST /api/masters/sizes - Insert Size Master Record
router.post('/sizes', addMasterSize);

// GET /api/masters/specifications - Select Specification Masters
router.get('/specifications', getMasterSpecifications);

// POST /api/masters/specifications - Insert Specification Master Record
router.post('/specifications', addMasterSpecification);

// GET /api/masters/images - Select Image Masters
router.get('/images', getMasterImages);

// POST /api/masters/images - Insert Image Master Record
router.post('/images', addMasterImage);

// GET /api/masters/sellers - Select Seller Masters
router.get('/sellers', getMasterSellers);

// GET /api/masters/payment-methods/:userId - Select User Payment Methods
router.get('/payment-methods/:userId', getPaymentMethods);

// POST /api/masters/payment-methods/:userId - Insert User Payment Method
router.post('/payment-methods/:userId', addPaymentMethod);

// DELETE /api/masters/payment-methods/:id - Delete User Payment Method
router.delete('/payment-methods/:id', deletePaymentMethod);

export default router;
