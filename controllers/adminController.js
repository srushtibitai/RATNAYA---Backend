import mongoose from 'mongoose';
import { db } from '../db/database.js';
import { Product } from '../models/Product.js';
import { Seller } from '../models/Seller.js';
import { Setting } from '../models/Setting.js';
import { isMongoReady } from '../config/db.js';
import { sendSellerRejectionEmail } from '../services/emailService.js';

/**
 * GET /api/admin/sellers/pending (Select Pending Sellers)
 */
export async function getPendingSellers(req, res) {
  if (isMongoReady()) {
    try {
      const pendingMongo = await Seller.find({ status: { $in: ['Pending Verification', 'Pending', 'Pending Review'] } }).lean();
      const formatted = pendingMongo.map(s => ({
        id: s.id || s._id.toString(),
        name: s.name,
        businessName: s.name,
        ownerName: s.owner || s.name,
        email: s.email,
        phone: s.phone,
        city: s.city,
        gst: s.gst,
        pan: s.pan,
        bisLicense: s.bisLicense,
        gstDoc: s.gstDoc || (s.name ? `/uploads/${s.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')}_GST_Certificate.pdf` : '/uploads/GST_Certificate.pdf'),
        panDoc: s.panDoc || (s.name ? `/uploads/${s.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')}_PAN_Card.jpg` : '/uploads/PAN_Card.jpg'),
        bisDoc: s.bisDoc || (s.name ? `/uploads/${s.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '')}_BIS_Hallmark_License.pdf` : '/uploads/BIS_Hallmark_License.pdf'),
        appliedDate: s.createdAt ? new Date(s.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: s.status || 'Pending Verification'
      }));
      return res.json({ success: true, database: 'MongoDB', data: formatted });
    } catch (err) {
      console.warn('MongoDB Pending Sellers Fetch Error:', err.message);
    }
  }

  const store = db.read();
  res.json({ success: true, database: 'Memory Store', data: store.pendingSellers || [] });
}

/**
 * PUT /api/admin/sellers/:id/approve (Approve Seller Application)
 */
export async function approveSeller(req, res) {
  const sellerId = req.params.id;

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(sellerId);
      const query = isObjId ? { $or: [{ id: sellerId }, { _id: sellerId }] } : { id: sellerId };
      const updated = await Seller.findOneAndUpdate(
        query,
        { status: 'Approved', verified: true },
        { returnDocument: 'after' }
      ).lean();

      if (updated) {
        const store = db.read();
        store.pendingSellers = (store.pendingSellers || []).filter((s) => s.id !== sellerId && s.email !== updated.email);
        db.write(store);
        return res.json({ success: true, database: 'MongoDB', message: 'Seller application approved and account activated', data: updated });
      }
    } catch (err) {
      console.warn('MongoDB Seller Approve Error:', err.message);
    }
  }

  const store = db.read();
  
  // Remove from pending queue
  const pendingIndex = (store.pendingSellers || []).findIndex((s) => s.id === sellerId);
  let applicant = null;
  if (pendingIndex !== -1) {
    applicant = store.pendingSellers.splice(pendingIndex, 1)[0];
  }

  // Update in store.sellers
  let seller = (store.sellers || []).find((s) => s.id === sellerId || (applicant && s.email === applicant.email));
  if (seller) {
    seller.status = 'Approved';
    seller.verified = true;
    if (applicant) {
      seller.gst = applicant.gst || seller.gst;
      seller.pan = applicant.pan || seller.pan;
      seller.bisLicense = applicant.bisLicense || seller.bisLicense;
    }
  } else if (applicant) {
    seller = {
      id: applicant.id || sellerId,
      name: applicant.businessName || applicant.name,
      owner: applicant.ownerName || applicant.owner || applicant.name,
      email: applicant.email || '',
      phone: applicant.phone || '',
      city: applicant.city || '',
      rating: 5.0,
      reviewsCount: 0,
      productsCount: 0,
      verified: true,
      joinedDate: new Date().toISOString().split('T')[0],
      logo: applicant.logo || '',
      banner: applicant.banner || '',
      about: applicant.about || '',
      gst: applicant.gst || '',
      pan: applicant.pan || '',
      bisLicense: applicant.bisLicense || '',
      status: 'Approved',
      commissionRate: store.settings.globalCommission || 10
    };
    store.sellers = store.sellers || [];
    store.sellers.unshift(seller);
  }

  db.write(store);
  res.json({ success: true, message: 'Seller application approved and account activated', data: seller || applicant });
}


/**
 * PUT /api/admin/sellers/:id/reject (Reject Seller Application & Send Rejection Email)
 */
export async function rejectSeller(req, res) {
  const { reason } = req.body;
  const sellerId = req.params.id;
  const rejectionReason = reason || 'Document verification or compliance requirements were not met by Admin.';

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(sellerId);
      const query = isObjId ? { $or: [{ id: sellerId }, { _id: sellerId }] } : { id: sellerId };
      const updated = await Seller.findOneAndUpdate(
        query,
        { status: 'Rejected', rejectionReason },
        { returnDocument: 'after' }
      ).lean();

      if (updated) {
        const store = db.read();
        store.pendingSellers = (store.pendingSellers || []).filter((s) => s.id !== sellerId && s.email !== updated.email);
        
        let sellerObj = (store.sellers || []).find((s) => s.id === sellerId || s.email === updated.email);
        if (!sellerObj) {
          store.sellers = store.sellers || [];
          store.sellers.unshift(updated);
        } else {
          sellerObj.status = 'Rejected';
          sellerObj.rejectionReason = rejectionReason;
        }
        db.write(store);

        const emailSent = await sendSellerRejectionEmail({
          sellerEmail: updated.email,
          sellerName: updated.name || updated.owner,
          reason: rejectionReason
        });
        return res.json({ success: true, database: 'MongoDB', message: 'Seller application rejected successfully', data: updated, emailSent });
      }
    } catch (err) {
      console.warn('MongoDB Seller Reject Error:', err.message);
    }
  }

  const store = db.read();
  
  const pendingIndex = (store.pendingSellers || []).findIndex((s) => s.id === sellerId);
  if (pendingIndex !== -1) {
    const applicant = store.pendingSellers.splice(pendingIndex, 1)[0];
    applicant.status = 'Rejected';
    applicant.rejectionReason = rejectionReason;
    store.rejectedSellers = store.rejectedSellers || [];
    store.rejectedSellers.unshift(applicant);

    let sellerObj = (store.sellers || []).find((s) => s.id === sellerId || s.email === applicant.email);
    if (!sellerObj) {
      sellerObj = {
        id: applicant.id || sellerId,
        name: applicant.businessName || applicant.name,
        owner: applicant.ownerName || applicant.owner || applicant.name,
        email: applicant.email || '',
        phone: applicant.phone || '',
        city: applicant.city || '',
        gst: applicant.gst || '',
        pan: applicant.pan || '',
        bisLicense: applicant.bisLicense || '',
        status: 'Rejected',
        rejectionReason
      };
      store.sellers = store.sellers || [];
      store.sellers.unshift(sellerObj);
    } else {
      sellerObj.status = 'Rejected';
      sellerObj.rejectionReason = rejectionReason;
    }

    db.write(store);

    const emailSent = await sendSellerRejectionEmail({
      sellerEmail: applicant.email,
      sellerName: applicant.businessName || applicant.name || applicant.owner,
      reason: rejectionReason
    });

    return res.json({ success: true, message: 'Seller application rejected', data: applicant, emailSent });
  }

  const seller = (store.sellers || []).find((s) => s.id === sellerId);
  if (seller) {
    seller.status = 'Rejected';
    seller.rejectionReason = rejectionReason;
    db.write(store);

    const emailSent = await sendSellerRejectionEmail({
      sellerEmail: seller.email,
      sellerName: seller.name || seller.owner,
      reason: rejectionReason
    });

    return res.json({ success: true, message: 'Seller account status updated to Rejected', data: seller, emailSent });
  }

  res.status(404).json({ success: false, message: 'Seller application not found' });
}

/**
 * GET /api/admin/products/pending (Select Pending Products)
 */
export async function getPendingProducts(req, res) {
  if (isMongoReady()) {
    try {
      const pending = await Product.find({ approvalStatus: 'Pending Approval' }).lean();
      return res.json({ success: true, database: 'MongoDB', data: pending });
    } catch (err) {
      console.warn('MongoDB Admin Pending Products Error:', err.message);
    }
  }

  const store = db.read();
  res.json({ success: true, data: store.pendingProducts || [] });
}

/**
 * PUT /api/admin/products/:id/approve (Admin Approve Product)
 */
export async function adminApproveProduct(req, res) {
  const prodId = req.params.id;

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(prodId);
      const query = isObjId ? { $or: [{ id: prodId }, { _id: prodId }] } : { id: prodId };
      const updated = await Product.findOneAndUpdate(
        query,
        { approvalStatus: 'Approved', status: 'Approved' },
        { returnDocument: 'after' }
      ).lean();
      if (updated) {
        return res.json({ success: true, database: 'MongoDB', message: 'Product approved and published to public storefront', data: updated });
      }
    } catch (err) {
      console.warn('MongoDB Admin Product Approve Error:', err.message);
    }
  }

  const store = db.read();
  store.pendingProducts = (store.pendingProducts || []).filter((p) => p.id !== prodId);

  const prod = (store.products || []).find((p) => p.id === prodId);
  if (prod) {
    prod.approvalStatus = 'Approved';
  }

  db.write(store);
  res.json({ success: true, message: 'Product approved and published to public storefront' });
}

/**
 * GET /api/admin/commission (Select Global Marketplace Commission %)
 */
export async function getCommission(req, res) {
  if (isMongoReady()) {
    try {
      const setting = await Setting.findOne({ key: 'globalCommission' }).lean();
      if (setting) {
        return res.json({ success: true, database: 'MongoDB', commission: setting.value });
      }
    } catch (e) {}
  }
  const store = db.read();
  res.json({ success: true, commission: store.settings?.globalCommission ?? 10 });
}

/**
 * PUT /api/admin/commission (Update Global Marketplace Commission %)
 */
export async function updateCommission(req, res) {
  const store = db.read();
  const newRate = Number(req.body.commission);
  if (isNaN(newRate) || newRate < 0 || newRate > 50) {
    return res.status(400).json({ success: false, message: 'Invalid commission rate' });
  }

  if (isMongoReady()) {
    try {
      await Setting.findOneAndUpdate(
        { key: 'globalCommission' },
        { key: 'globalCommission', value: newRate },
        { upsert: true, new: true }
      );
    } catch (e) {}
  }

  if (!store.settings) store.settings = {};
  store.settings.globalCommission = newRate;
  db.write(store);
  res.json({ success: true, message: 'Global marketplace commission updated', commission: newRate });
}

/**
 * GET /api/admin/gst (Select Global Marketplace GST Rate %)
 */
export async function getGstRate(req, res) {
  if (isMongoReady()) {
    try {
      const setting = await Setting.findOne({ key: 'globalGstRate' }).lean();
      if (setting) {
        return res.json({ success: true, database: 'MongoDB', gstRate: setting.value });
      }
    } catch (e) {}
  }
  const store = db.read();
  res.json({ success: true, gstRate: store.settings?.globalGstRate ?? 3 });
}

/**
 * PUT /api/admin/gst (Update Global Marketplace GST Rate %)
 */
export async function updateGstRate(req, res) {
  const newRate = Number(req.body.gstRate);
  if (isNaN(newRate) || newRate < 0 || newRate > 100) {
    return res.status(400).json({ success: false, message: 'Invalid GST rate percentage' });
  }

  if (isMongoReady()) {
    try {
      await Setting.findOneAndUpdate(
        { key: 'globalGstRate' },
        { key: 'globalGstRate', value: newRate },
        { upsert: true, new: true }
      );
    } catch (e) {}
  }

  const store = db.read();
  if (!store.settings) store.settings = {};
  store.settings.globalGstRate = newRate;
  db.write(store);
  res.json({ success: true, message: 'Global GST rate updated successfully', gstRate: newRate });
}
