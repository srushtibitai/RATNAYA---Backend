import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { Seller } from '../models/Seller.js';
import { User } from '../models/User.js';
import { db } from '../db/database.js';
import { isMongoReady } from '../config/db.js';
import { sendProductRejectionEmail } from '../services/emailService.js';

// Helper to find seller email for notifications
async function getSellerEmail(sellerId, sellerName, localStore) {
  if (isMongoReady()) {
    try {
      const cleanId = sellerId ? String(sellerId).replace(/^seller-/, '') : '';
      const prefixedId = sellerId ? (String(sellerId).startsWith('seller-') ? String(sellerId) : `seller-${sellerId}`) : '';

      // 1. Search Seller collection
      const seller = await Seller.findOne({
        $or: [
          { id: sellerId },
          { id: prefixedId },
          { id: cleanId },
          { _id: mongoose.Types.ObjectId.isValid(cleanId) ? cleanId : null },
          { name: sellerName },
          { businessName: sellerName },
          { owner: sellerName }
        ]
      }).lean();

      if (seller && seller.email) return seller.email;

      // 2. Search User collection for registered seller accounts
      const user = await User.findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(cleanId) ? cleanId : null },
          { name: sellerName },
          { email: sellerName }
        ]
      }).lean();

      if (user && user.email) return user.email;

      // 3. Match any active seller in DB
      const anySeller = await Seller.findOne({ email: { $exists: true, $ne: '' } }).lean();
      if (anySeller && anySeller.email) return anySeller.email;
    } catch (e) {
      console.warn('Error fetching seller email:', e.message);
    }
  }

  const storeSeller = (localStore?.sellers || []).find((s) => s.id === sellerId || s.name === sellerName);
  if (storeSeller && storeSeller.email) return storeSeller.email;

  return 'bitaironak@gmail.com';
}

/**
 * GET /api/products (Select Public Catalog)
 */
export async function getAllProducts(req, res) {
  const { search, category, sellerId, metal, size, maxPrice, status, page, limit } = req.query;

  if (isMongoReady()) {
    try {
      const filter = {};
      if (status && status !== 'all') {
        filter.approvalStatus = status;
      } else if (!sellerId || sellerId === 'all') {
        filter.approvalStatus = 'Approved';
      }

      if (category && category !== 'all') filter.category = category;
      if (sellerId && sellerId !== 'all') filter.sellerId = sellerId;
      if (metal && metal !== 'all') filter.metal = { $regex: metal, $options: 'i' };
      if (size && size !== 'all') filter.availableSizes = size;
      if (maxPrice) filter.price = { $lte: Number(maxPrice) };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { categoryName: { $regex: search, $options: 'i' } },
          { sellerName: { $regex: search, $options: 'i' } },
          { material: { $regex: search, $options: 'i' } }
        ];
      }

      const totalCount = await Product.countDocuments(filter);

      if (page) {
        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 9;
        const skip = (pageNum - 1) * limitNum;

        const products = await Product.find(filter).sort({ _id: -1 }).skip(skip).limit(limitNum).lean();
        return res.json({
          success: true,
          database: 'MongoDB Database',
          count: totalCount,
          page: pageNum,
          totalPages: Math.ceil(totalCount / limitNum),
          data: products
        });
      }

      const products = await Product.find(filter).sort({ _id: -1 }).lean();
      return res.json({ success: true, database: 'MongoDB Database', count: totalCount, data: products });
    } catch (err) {
      console.warn('MongoDB Product Query Error:', err.message);
    }
  }

  // Memory Fallback Store
  const store = db.read();
  let products = store.products || [];

  if (status && status !== 'all') {
    products = products.filter((p) => (p.approvalStatus || 'Approved') === status);
  } else if (!sellerId || sellerId === 'all') {
    products = products.filter((p) => (p.approvalStatus || 'Approved') === 'Approved');
  }

  if (category && category !== 'all') products = products.filter((p) => p.category === category);
  if (sellerId && sellerId !== 'all') products = products.filter((p) => p.sellerId === sellerId);
  if (metal && metal !== 'all') products = products.filter((p) => p.metal.toLowerCase().includes(metal.toLowerCase()));
  if (maxPrice) products = products.filter((p) => p.price <= Number(maxPrice));

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName?.toLowerCase().includes(q) ||
        p.sellerName?.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, database: 'Memory Fallback Store', count: products.length, data: products });
}

/**
 * GET /api/products/seller/my-products (Select Seller Scoped Products)
 */
export async function getSellerProducts(req, res) {
  const sellerId = req.user?.sellerId || req.user?.id || req.query.sellerId || 'seller-1';
  const sellerEmail = req.user?.email;
  const sellerName = req.user?.name;

  if (isMongoReady()) {
    try {
      const query = {
        $or: [
          { sellerId: sellerId },
          { sellerId: 'seller-1' },
          ...(sellerEmail ? [{ sellerEmail }] : []),
          ...(sellerName ? [{ sellerName }] : [])
        ]
      };
      const products = await Product.find(query).sort({ _id: -1 }).lean();
      return res.json({ success: true, database: 'MongoDB Database', count: products.length, data: products });
    } catch (err) {
      console.warn('MongoDB Seller Products Error:', err.message);
    }
  }

  const store = db.read();
  const sellerProds = (store.products || []).filter(
    p => p.sellerId === sellerId || (sellerEmail && p.sellerEmail === sellerEmail) || (sellerName && p.sellerName === sellerName)
  );
  res.json({ success: true, database: 'Memory Store', count: sellerProds.length, data: sellerProds });
}

/**
 * GET /api/products/:id (Select Product Details)
 */
export async function getProductById(req, res) {
  const { id } = req.params;
  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjId ? { $or: [{ id }, { _id: id }] } : { id };
      const product = await Product.findOne(query).lean();
      if (product) {
        return res.json({ success: true, database: 'MongoDB', data: product });
      }
    } catch (err) {
      console.warn('MongoDB Product Find Error:', err.message);
    }
  }

  const store = db.read();
  const product = (store.products || []).find((p) => p.id === id);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }
  res.json({ success: true, database: 'Memory Store', data: product });
}

/**
 * POST /api/products (Insert Seller Product Listing)
 */
export async function createProduct(req, res) {
  try {
    const primaryImg = req.body.image || (req.body.images && req.body.images[0]) || '/assets/jewellery/necklace/1.jpg';
    const secondaryImg = (req.body.images && req.body.images[1]) || req.body.image2 || primaryImg;

    const newProductData = {
      id: req.body.id || `prod-req-${Date.now()}`,
      sku: req.body.sku || `SKU-${Date.now().toString().slice(-6)}`,
      name: req.body.name || 'Untitled Jewellery Piece',
      category: req.body.category || 'necklaces',
      categoryName: req.body.categoryName || 'Necklaces',
      sellerId: req.user?.sellerId || req.body.sellerId || 'seller-1',
      sellerName: req.user?.name || req.body.sellerName || 'Verified Jeweller',
      sellerEmail: req.user?.email || req.body.sellerEmail || '',
      sellerRating: Number(req.body.sellerRating) || 4.9,
      price: Number(req.body.price) || 10000,
      originalPrice: req.body.originalPrice ? Number(req.body.originalPrice) : null,
      stock: Number(req.body.stock) || 5,
      metal: req.body.metal || '22K Gold',
      purity: req.body.purity || '22K BIS Hallmarked',
      weight: req.body.weight || '35 grams',
      description: req.body.description || '',
      images: [primaryImg, secondaryImg],
      approvalStatus: 'Pending Approval',
      createdAt: new Date()
    };

    if (isMongoReady()) {
      try {
        const mongoProduct = await Product.create(newProductData);
        return res.status(201).json({ success: true, database: 'MongoDB', message: 'Product submitted for admin review', data: mongoProduct });
      } catch (err) {
        console.warn('MongoDB Product Create Error:', err.message);
      }
    }

    const store = db.read();
    if (!store.products) store.products = [];
    store.products.unshift(newProductData);
    db.write(store);
    return res.status(201).json({ success: true, database: 'Memory Store', message: 'Product submitted for admin review', data: newProductData });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * PUT /api/products/:id (Update Product Details)
 */
export async function updateProduct(req, res) {
  const { id } = req.params;
  const updateData = { ...req.body };

  if (updateData.price) updateData.price = Number(updateData.price);
  if (updateData.stock) updateData.stock = Number(updateData.stock);

  updateData.approvalStatus = 'Pending Approval';
  updateData.status = 'Pending Approval';
  updateData.resubmittedAt = new Date();

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjId ? { $or: [{ id }, { _id: id }] } : { id };
      const updated = await Product.findOneAndUpdate(
        query,
        { $set: updateData },
        { returnDocument: 'after' }
      ).lean();

      if (updated) {
        return res.json({ success: true, database: 'MongoDB', message: 'Product updated and resubmitted for admin review', data: updated });
      }
    } catch (err) {
      console.warn('MongoDB Product Update Error:', err.message);
    }
  }

  const store = db.read();
  const index = (store.products || []).findIndex((p) => p.id === id || p._id === id);
  if (index !== -1) {
    store.products[index] = { ...store.products[index], ...updateData };
    db.write(store);
    return res.json({ success: true, database: 'Memory Store', message: 'Product updated and resubmitted for admin review', data: store.products[index] });
  }

  res.status(404).json({ success: false, message: 'Product not found' });
}



/**
 * PUT /api/products/:id/approve (Admin Approve Product)
 */
export async function approveProduct(req, res) {
  const { id } = req.params;

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjId ? { $or: [{ id }, { _id: id }] } : { id };
      const updated = await Product.findOneAndUpdate(
        query,
        { $set: { approvalStatus: 'Approved', status: 'Approved', rejectionReason: '' } },
        { returnDocument: 'after' }
      ).lean();

      if (updated) {
        return res.json({ success: true, database: 'MongoDB', message: 'Product approved successfully', data: updated });
      }
    } catch (err) {
      console.warn('MongoDB Product Approve Error:', err.message);
    }
  }

  const store = db.read();
  const index = (store.products || []).findIndex((p) => p.id === id || p._id === id);
  if (index !== -1) {
    store.products[index].approvalStatus = 'Approved';
    store.products[index].status = 'Approved';
    store.products[index].rejectionReason = '';
    db.write(store);
    return res.json({ success: true, database: 'Memory Store', message: 'Product approved successfully', data: store.products[index] });
  }

  res.status(404).json({ success: false, message: 'Product not found' });
}

/**
 * PUT /api/products/:id/reject (Admin Reject Product & Send Mail)
 */
export async function rejectProduct(req, res) {
  const { id } = req.params;
  const reason = req.body.reason || req.body.rejectionReason || 'Product specs do not meet guidelines.';
  const rejectedAt = new Date();

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjId ? { $or: [{ id }, { _id: id }] } : { id };
      const updated = await Product.findOneAndUpdate(
        query,
        {
          $set: {
            approvalStatus: 'Rejected',
            status: 'Rejected',
            rejectionReason: reason,
            rejectedAt: rejectedAt
          }
        },
        { returnDocument: 'after' }
      ).lean();

      if (updated) {
        const sellerEmail = updated.sellerEmail || await getSellerEmail(updated.sellerId, updated.sellerName);
        const emailSent = await sendProductRejectionEmail({
          sellerEmail,
          sellerName: updated.sellerName || 'Jeweller Partner',
          productName: updated.name || 'Jewellery Product',
          productId: updated.id || updated._id,
          reason
        });

        return res.json({
          success: true,
          database: 'MongoDB',
          message: 'Product rejected with reason',
          emailSent,
          sellerEmail,
          data: updated
        });
      }
    } catch (err) {
      console.warn('MongoDB Product Reject Error:', err.message);
    }
  }

  const store = db.read();
  const index = (store.products || []).findIndex((p) => p.id === id || p._id === id);
  if (index !== -1) {
    const prod = store.products[index];
    prod.approvalStatus = 'Rejected';
    prod.status = 'Rejected';
    prod.rejectionReason = reason;
    prod.rejectedAt = rejectedAt;
    db.write(store);

    const sellerEmail = prod.sellerEmail || await getSellerEmail(prod.sellerId, prod.sellerName, store);
    const emailSent = await sendProductRejectionEmail({
      sellerEmail,
      sellerName: prod.sellerName || 'Jeweller Partner',
      productName: prod.name || 'Jewellery Product',
      productId: prod.id || prod._id,
      reason
    });

    return res.json({
      success: true,
      database: 'Memory Store',
      message: 'Product rejected with reason',
      emailSent,
      sellerEmail,
      data: store.products[index]
    });
  }

  res.status(404).json({ success: false, message: 'Product not found' });
}

/**
 * DELETE /api/products/:id (Delete Product)
 */
export async function deleteProduct(req, res) {
  const { id } = req.params;

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(id);
      const query = isObjId ? { $or: [{ id }, { _id: id }] } : { id };
      await Product.deleteOne(query);
      return res.json({ success: true, database: 'MongoDB', message: 'Product deleted successfully' });
    } catch (err) {
      console.warn('MongoDB Product Delete Error:', err.message);
    }
  }

  const store = db.read();
  store.products = (store.products || []).filter((p) => p.id !== id);
  db.write(store);
  res.json({ success: true, database: 'Memory Store', message: 'Product deleted successfully' });
}
