import { Banner } from '../models/Banner.js';

/**
 * GET /api/banners - Select All Hero Banners
 */
export async function getBanners(req, res) {
  try {
    const banners = await Banner.find({}).sort({ slideId: 1, createdAt: 1 });
    res.json({ success: true, count: banners.length, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching hero banners', error: error.message });
  }
}

/**
 * POST /api/banners - Insert New Hero Banner
 */
export async function addBanner(req, res) {
  try {
    const newBanner = new Banner(req.body);
    await newBanner.save();
    res.status(201).json({ success: true, message: 'Hero banner added successfully', data: newBanner });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding hero banner', error: error.message });
  }
}

/**
 * PUT /api/banners/:id - Update Hero Banner
 */
export async function updateBanner(req, res) {
  try {
    const updated = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Hero banner updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating hero banner', error: error.message });
  }
}

/**
 * DELETE /api/banners/:id - Delete Hero Banner
 */
export async function deleteBanner(req, res) {
  try {
    await Banner.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Hero banner deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting hero banner', error: error.message });
  }
}
