import express from 'express';
import { getCategories, addCategory } from '../controllers/categoryController.js';

const router = express.Router();

// GET /api/categories - Select All Categories
router.get('/', getCategories);

// POST /api/categories - Insert New Category
router.post('/', addCategory);

export default router;
