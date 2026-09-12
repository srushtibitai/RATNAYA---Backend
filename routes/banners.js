import express from 'express';
import { getBanners, addBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';

const router = express.Router();

// GET /api/banners - Select All Hero Banners
router.get('/', getBanners);

// POST /api/banners - Insert New Hero Banner
router.post('/', addBanner);

// PUT /api/banners/:id - Update Hero Banner
router.put('/:id', updateBanner);

// DELETE /api/banners/:id - Delete Hero Banner
router.delete('/:id', deleteBanner);

export default router;
