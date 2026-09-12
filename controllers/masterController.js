import { Category } from '../models/Category.js';
import { SizeMaster } from '../models/SizeMaster.js';
import { SpecificationMaster } from '../models/SpecificationMaster.js';
import { ImageMaster } from '../models/ImageMaster.js';
import { PaymentMethod } from '../models/PaymentMethod.js';
import { Seller } from '../models/Seller.js';
import { isMongoReady } from '../config/db.js';
import { db } from '../db/database.js';

/**
 * GET /api/masters/categories - Select Category Masters
 */
export async function getMasterCategories(req, res) {
  if (isMongoReady()) {
    try {
      const categories = await Category.find({}).lean();
      return res.json({ success: true, source: 'MongoDB Master Collection', count: categories.length, data: categories });
    } catch (err) {
      console.warn('MongoDB Category Master query error:', err.message);
    }
  }
  const store = db.read();
  res.json({ success: true, source: 'Memory Fallback', count: (store.categories || []).length, data: store.categories || [] });
}

/**
 * GET /api/masters/sizes - Select Size Masters
 */
export async function getMasterSizes(req, res) {
  const { category } = req.query;
  if (isMongoReady()) {
    try {
      const filter = category ? { category } : {};
      const sizes = await SizeMaster.find(filter).lean();
      return res.json({ success: true, source: 'MongoDB Master Collection', count: sizes.length, data: sizes });
    } catch (err) {
      console.warn('MongoDB Size Master query error:', err.message);
    }
  }
  res.json({
    success: true,
    source: 'Memory Fallback',
    data: [
      { category: 'rings', availableSizes: ['12', '14', '16', '18'] },
      { category: 'bracelets', availableSizes: ['2.4 Size', '2.6 Size', '2.8 Size'] },
      { category: 'necklaces', availableSizes: ['16 Inch', '18 Inch', '20 Inch'] },
      { category: 'earrings', availableSizes: ['Standard', 'Small', 'Medium'] }
    ]
  });
}

/**
 * POST /api/masters/sizes - Insert Size Master Record
 */
export async function addMasterSize(req, res) {
  try {
    const newSize = new SizeMaster(req.body);
    await newSize.save();
    res.status(201).json({ success: true, message: 'Size Master added successfully', data: newSize });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding Size Master', error: error.message });
  }
}

/**
 * GET /api/masters/specifications - Select Specification Masters
 */
export async function getMasterSpecifications(req, res) {
  if (isMongoReady()) {
    try {
      const specs = await SpecificationMaster.find({}).lean();
      return res.json({ success: true, source: 'MongoDB Master Collection', count: specs.length, data: specs });
    } catch (err) {
      console.warn('MongoDB Specification Master query error:', err.message);
    }
  }
  res.json({
    success: true,
    source: 'Memory Fallback',
    data: [
      { label: 'Gold Purity', options: ['22K BIS 916', '18K 750'] },
      { label: 'Metal Type', options: ['22K Gold', '18K White Gold', '18K Rose Gold', 'Platinum 950'] }
    ]
  });
}

/**
 * POST /api/masters/specifications - Insert Specification Master Record
 */
export async function addMasterSpecification(req, res) {
  try {
    const newSpec = new SpecificationMaster(req.body);
    await newSpec.save();
    res.status(201).json({ success: true, message: 'Specification Master added successfully', data: newSpec });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding Specification Master', error: error.message });
  }
}

/**
 * GET /api/masters/images - Select Image Masters
 */
export async function getMasterImages(req, res) {
  const { category } = req.query;
  if (isMongoReady()) {
    try {
      const filter = category ? { category } : {};
      const images = await ImageMaster.find(filter).lean();
      return res.json({ success: true, source: 'MongoDB Master Collection', count: images.length, data: images });
    } catch (err) {
      console.warn('MongoDB Image Master query error:', err.message);
    }
  }
  res.json({ success: true, source: 'Memory Fallback', data: [] });
}

/**
 * POST /api/masters/images - Insert Image Master Record
 */
export async function addMasterImage(req, res) {
  try {
    const newImage = new ImageMaster(req.body);
    await newImage.save();
    res.status(201).json({ success: true, message: 'Image Master added successfully', data: newImage });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error adding Image Master', error: error.message });
  }
}

/**
 * GET /api/masters/sellers - Select Seller Masters
 */
export async function getMasterSellers(req, res) {
  if (isMongoReady()) {
    try {
      const sellers = await Seller.find({}).lean();
      return res.json({ success: true, source: 'MongoDB Master Collection', count: sellers.length, data: sellers });
    } catch (err) {
      console.warn('MongoDB Seller Master query error:', err.message);
    }
  }
  const store = db.read();
  res.json({ success: true, source: 'Memory Fallback', count: (store.sellers || []).length, data: store.sellers || [] });
}

/**
 * GET /api/masters/payment-methods/:userId - Select User Payment Methods
 */
export async function getPaymentMethods(req, res) {
  try {
    const { userId } = req.params;
    const methods = await PaymentMethod.find({ userId });
    res.json({ success: true, count: methods.length, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching payment methods', error: error.message });
  }
}

/**
 * POST /api/masters/payment-methods/:userId - Insert User Payment Method
 */
export async function addPaymentMethod(req, res) {
  try {
    const { userId } = req.params;
    const newMethod = new PaymentMethod({ userId, ...req.body });
    await newMethod.save();
    res.status(201).json({ success: true, message: 'Payment method saved successfully', data: newMethod });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error saving payment method', error: error.message });
  }
}

/**
 * DELETE /api/masters/payment-methods/:id - Delete User Payment Method
 */
export async function deletePaymentMethod(req, res) {
  try {
    await PaymentMethod.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Payment method deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting payment method', error: error.message });
  }
}
