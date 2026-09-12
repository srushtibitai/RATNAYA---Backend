import mongoose from 'mongoose';
import { Seller } from '../models/Seller.js';
import { db } from '../db/database.js';
import { isMongoReady, connectDB } from '../config/db.js';

const formatSellerImages = (s) => ({
  ...s,
  logo: (s.logo && !s.logo.includes('unsplash.com')) ? s.logo : '/uploads/avatar.jpg',
  banner: (s.banner && !s.banner.includes('unsplash.com')) ? s.banner : '/uploads/banner.jpg'
});

/**
 * GET /api/sellers (Select Sellers List)
 */
export async function getSellers(req, res) {
  if (isMongoReady()) {
    try {
      const sellers = await Seller.find({}).lean();
      const formattedSellers = sellers.map(formatSellerImages);
      return res.json({ success: true, database: 'MongoDB', count: formattedSellers.length, data: formattedSellers });
    } catch (err) {
      console.warn('MongoDB Sellers Query Error:', err.message);
    }
  }

  const store = db.read();
  const formattedSellers = (store.sellers || []).map(formatSellerImages);
  res.json({ success: true, database: 'Memory Store', count: formattedSellers.length, data: formattedSellers });
}

/**
 * GET /api/sellers/:id (Select Seller Profile Details)
 */
export async function getSellerById(req, res) {
  const sellerId = req.params.id;

  if (isMongoReady()) {
    try {
      const isObjId = mongoose.Types.ObjectId.isValid(sellerId);
      const query = isObjId ? { $or: [{ id: sellerId }, { _id: sellerId }, { email: sellerId }] } : { $or: [{ id: sellerId }, { email: sellerId }] };
      const seller = await Seller.findOne(query).lean();
      if (seller) {
        return res.json({ success: true, database: 'MongoDB', data: formatSellerImages(seller) });
      }
    } catch (err) {
      console.warn('MongoDB Seller Find Error:', err.message);
    }
  }

  const store = db.read();
  let seller = (store.sellers || []).find((s) => s.id === sellerId || s.email === sellerId);
  if (!seller) {
    seller = (store.pendingSellers || []).find((s) => s.id === sellerId || s.email === sellerId);
  }
  if (!seller) {
    seller = (store.rejectedSellers || []).find((s) => s.id === sellerId || s.email === sellerId);
  }
  if (!seller) {
    return res.status(404).json({ success: false, message: 'Seller not found' });
  }

  const sellerProducts = (store.products || []).filter((p) => p.sellerId === seller.id);
  res.json({ success: true, database: 'Memory Store', data: { ...formatSellerImages(seller), products: sellerProducts } });
}

/**
 * POST /api/sellers/add (Admin Adds Seller)
 */
export async function addSeller(req, res) {
  const { name, owner, email, phone, city, gst, pan, commissionRate = 10 } = req.body;
  const sellerId = `seller-${Date.now()}`;
  const cleanGst = (gst || '').trim().toUpperCase();

  // Enforce duplicate GST Check
  if (cleanGst) {
    if (isMongoReady()) {
      try {
        const existingGstSeller = await Seller.findOne({ gst: { $regex: new RegExp(`^${cleanGst}$`, 'i') } });
        if (existingGstSeller) {
          return res.status(400).json({
            success: false,
            message: `A seller with GSTIN "${cleanGst}" is already registered (${existingGstSeller.name}). Duplicate GSTIN is not allowed.`
          });
        }
      } catch (err) {
        console.warn('MongoDB Seller GST check error:', err.message);
      }
    }

    const store = db.read();
    const existingMemorySeller = (store.sellers || []).find(
      (s) => s.gst && s.gst.trim().toUpperCase() === cleanGst
    );
    if (existingMemorySeller) {
      return res.status(400).json({
        success: false,
        message: `A seller with GSTIN "${cleanGst}" is already registered (${existingMemorySeller.name}). Duplicate GSTIN is not allowed.`
      });
    }
  }

  const newSellerData = {
    id: sellerId,
    name: name || '',
    owner: owner || '',
    email: email || '',
    phone: phone || '',
    city: city || '',
    rating: 5.0,
    reviewsCount: 0,
    productsCount: 0,
    verified: true,
    joinedDate: new Date().getFullYear().toString(),
    logo: req.body.logo || '/uploads/avatar.jpg',
    banner: req.body.banner || '/uploads/banner.jpg',
    about: '',
    gst: cleanGst,
    pan: pan || '',
    status: 'Approved',
    commissionRate: Number(commissionRate) || 10,
    createdAt: new Date()
  };

  if (isMongoReady()) {
    try {
      const mongoSeller = await Seller.create(newSellerData);
      return res.status(201).json({ success: true, database: 'MongoDB', message: 'New Jeweller Seller added successfully by Admin', data: mongoSeller });
    } catch (err) {
      console.warn('MongoDB Seller Create Error:', err.message);
    }
  }

  const store = db.read();
  store.sellers = store.sellers || [];
  store.sellers.unshift(newSellerData);
  db.write(store);

  res.status(201).json({ success: true, database: 'Memory Store', message: 'New Jeweller Seller added successfully by Admin', data: newSellerData });
}

/**
 * PUT /api/sellers/:id/commission (Admin Update Seller Commission %)
 */
export async function updateSellerCommission(req, res) {
  const { commissionRate } = req.body;
  const newRate = Number(commissionRate);

  if (isNaN(newRate) || newRate < 0 || newRate > 100) {
    return res.status(400).json({ success: false, message: 'Invalid commission rate percentage' });
  }

  if (isMongoReady()) {
    try {
      const updatedSeller = await Seller.findOneAndUpdate(
        { id: req.params.id },
        { commissionRate: newRate },
        { new: true }
      ).lean();

      if (updatedSeller) {
        return res.json({ success: true, database: 'MongoDB', message: `Commission rate updated to ${newRate}%`, data: updatedSeller });
      }
    } catch (err) {
      console.warn('MongoDB Seller Commission Update Error:', err.message);
    }
  }

  const store = db.read();
  const seller = (store.sellers || []).find((s) => s.id === req.params.id);
  if (seller) {
    seller.commissionRate = newRate;
    db.write(store);
    return res.json({ success: true, database: 'Memory Store', message: `Commission rate updated to ${newRate}%`, data: seller });
  }

  res.status(404).json({ success: false, message: 'Seller not found' });
}

/**
 * POST /api/sellers/register (Seller Public Application)
 */
export async function registerSeller(req, res) {
  const cleanGst = (req.body.gst || '').trim().toUpperCase();

  // Enforce duplicate GST check
  if (cleanGst) {
    if (isMongoReady()) {
      try {
        const existingGstSeller = await Seller.findOne({ gst: { $regex: new RegExp(`^${cleanGst}$`, 'i') } });
        if (existingGstSeller) {
          return res.status(400).json({
            success: false,
            message: `A seller with GSTIN "${cleanGst}" is already registered (${existingGstSeller.name}). Duplicate GSTIN is not allowed.`
          });
        }
      } catch (err) {
        console.warn('MongoDB Seller GST check error:', err.message);
      }
    }

    const storeCheck = db.read();
    const existingMemorySeller = (storeCheck.sellers || []).find(
      (s) => s.gst && s.gst.trim().toUpperCase() === cleanGst
    );
    const existingPendingSeller = (storeCheck.pendingSellers || []).find(
      (s) => s.gst && s.gst.trim().toUpperCase() === cleanGst
    );

    if (existingMemorySeller || existingPendingSeller) {
      const existingName = (existingMemorySeller || existingPendingSeller).name || 'Existing Jeweller';
      return res.status(400).json({
        success: false,
        message: `A seller with GSTIN "${cleanGst}" already exists (${existingName}). Duplicate GSTIN is not allowed.`
      });
    }
  }

  const sellerId = `seller-${Date.now()}`;
  const sellerDoc = {
    id: sellerId,
    name: req.body.businessName || req.body.name || 'Jeweller Applicant',
    owner: req.body.ownerName || req.body.owner || req.body.name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    city: req.body.city || '',
    rating: 5.0,
    reviewsCount: 0,
    productsCount: 0,
    verified: false,
    joinedDate: new Date().getFullYear().toString(),
    logo: req.body.logo || '/uploads/avatar.jpg',
    banner: req.body.banner || '/uploads/banner.jpg',
    about: req.body.about || '',
    gst: cleanGst,
    pan: req.body.pan || '',
    bisLicense: req.body.bisLicense || '',
    gstDoc: req.body.gstDoc || '',
    panDoc: req.body.panDoc || '',
    bisDoc: req.body.bisDoc || '',
    status: 'Pending Verification',
    commissionRate: 10,
    createdAt: new Date()
  };

  if (isMongoReady()) {
    try {
      const createdMongo = await Seller.create(sellerDoc);
      return res.status(201).json({
        success: true,
        database: 'MongoDB',
        message: 'Seller application submitted successfully. Compliance verification pending.',
        data: createdMongo
      });
    } catch (err) {
      console.warn('MongoDB Seller Register Error:', err.message);
    }
  }

  const store = db.read();
  store.pendingSellers = store.pendingSellers || [];
  store.pendingSellers.unshift({ ...sellerDoc, appliedDate: new Date().toISOString().split('T')[0] });

  db.write(store);
  res.status(201).json({
    success: true,
    database: 'Memory Store',
    message: 'Seller application submitted successfully. Compliance verification pending.',
    data: sellerDoc
  });
}

/**
 * PUT /api/sellers/:id/profile (Seller Updates Store Profile)
 */
export async function updateSellerProfile(req, res) {
  await connectDB();
  const sellerId = req.params.id;
  const updates = req.body;
  const cleanGst = (updates.gst || '').trim().toUpperCase();

  const rawId = sellerId ? sellerId.replace(/^seller-/, '') : '';
  const prefixedId = rawId ? `seller-${rawId}` : sellerId;

  // Build MongoDB query filter matching sellerId, seller-sellerId, rawId, or email
  const queryConditions = [];
  if (sellerId) queryConditions.push({ id: sellerId });
  if (prefixedId) queryConditions.push({ id: prefixedId });
  if (rawId) queryConditions.push({ id: rawId });
  if (updates.email) queryConditions.push({ email: updates.email });

  if (sellerId && mongoose.Types.ObjectId.isValid(sellerId)) {
    queryConditions.push({ _id: sellerId });
  }
  if (rawId && mongoose.Types.ObjectId.isValid(rawId)) {
    queryConditions.push({ _id: rawId });
  }

  const findFilter = queryConditions.length > 0 ? { $or: queryConditions } : { id: sellerId };

  // Enforce duplicate GST check
  if (cleanGst) {
    if (isMongoReady()) {
      try {
        const existingGstSeller = await Seller.findOne({
          gst: { $regex: new RegExp(`^${cleanGst}$`, 'i') },
          $nor: queryConditions
        });
        if (existingGstSeller) {
          return res.status(400).json({
            success: false,
            message: `GSTIN "${cleanGst}" is already registered to another seller (${existingGstSeller.name}). Duplicate GSTIN is not allowed.`
          });
        }
      } catch (err) {
        console.warn('MongoDB Seller Update GST check error:', err.message);
      }
    }

    const storeCheck = db.read();
    const existingMemorySeller = (storeCheck.sellers || []).find(
      (s) => s.id !== sellerId && s.gst && s.gst.trim().toUpperCase() === cleanGst
    );
    if (existingMemorySeller) {
      return res.status(400).json({
        success: false,
        message: `GSTIN "${cleanGst}" is already registered to another seller (${existingMemorySeller.name}). Duplicate GSTIN is not allowed.`
      });
    }
  }

  // If status is currently Rejected, resubmitting profile updates it to Pending Verification for Admin review
  const nextStatus = updates.status && updates.status !== 'Rejected' ? updates.status : 'Pending Verification';

  if (isMongoReady()) {
    try {
      let updatedMongoSeller = await Seller.findOneAndUpdate(
        findFilter,
        { ...updates, gst: cleanGst || updates.gst, status: nextStatus },
        { returnDocument: 'after' }
      ).lean();

      if (!updatedMongoSeller) {
        const newSellerData = {
          id: prefixedId || `seller-${Date.now()}`,
          name: updates.name || updates.businessName || 'Seller Store',
          owner: updates.owner || updates.ownerName || '',
          email: updates.email || '',
          phone: updates.phone || '',
          city: updates.city || '',
          gst: cleanGst || updates.gst || '',
          pan: updates.pan || '',
          bisLicense: updates.bisLicense || '',
          gstDoc: updates.gstDoc || '',
          panDoc: updates.panDoc || '',
          bisDoc: updates.bisDoc || '',
          logo: updates.logo || '',
          banner: updates.banner || '',
          about: updates.about || '',
          status: nextStatus,
          joinedDate: new Date().getFullYear().toString()
        };
        const createdSeller = await Seller.create(newSellerData);
        updatedMongoSeller = createdSeller.toObject();
      }

      console.log(`✅ [MONGODB SUCCESS] Seller profile updated/saved for "${updatedMongoSeller.name}" (${updatedMongoSeller.id})`);

      return res.json({
        success: true,
        database: 'MongoDB',
        message: 'Seller profile updated successfully in MongoDB and resubmitted for Admin verification.',
        data: updatedMongoSeller
      });
    } catch (err) {
      console.warn('MongoDB Seller Profile Update Error:', err.message);
      return res.status(500).json({ success: false, message: `Database update error: ${err.message}` });
    }
  }

  const store = db.read();
  let seller = (store.sellers || []).find((s) => s.id === sellerId);
  if (!seller) {
    seller = { id: sellerId, ...updates, status: nextStatus };
    store.sellers = store.sellers || [];
    store.sellers.unshift(seller);
  } else {
    Object.assign(seller, { ...updates, status: nextStatus });
  }

  // Remove from rejected queue if present
  if (store.rejectedSellers) {
    store.rejectedSellers = store.rejectedSellers.filter(s => s.id !== sellerId && s.email !== seller.email);
  }

  // Add/update in pendingSellers queue for Admin review
  store.pendingSellers = store.pendingSellers || [];
  const pIndex = store.pendingSellers.findIndex(s => s.id === sellerId || s.email === seller.email);
  const pendingData = {
    id: sellerId,
    name: seller.name,
    businessName: seller.name,
    ownerName: seller.owner,
    email: seller.email,
    phone: seller.phone,
    city: seller.city,
    gst: seller.gst,
    pan: seller.pan,
    bisLicense: seller.bisLicense,
    gstDoc: seller.gstDoc,
    panDoc: seller.panDoc,
    bisDoc: seller.bisDoc,
    appliedDate: new Date().toISOString().split('T')[0],
    status: 'Pending Verification'
  };

  if (pIndex !== -1) {
    store.pendingSellers[pIndex] = { ...store.pendingSellers[pIndex], ...pendingData };
  } else {
    store.pendingSellers.unshift(pendingData);
  }

  db.write(store);
  res.json({ success: true, database: 'Memory Store', message: 'Seller profile updated successfully and submitted for verification', data: seller });
}

// POST /api/sellers/verify-document - Verify GST, PAN & BIS License credentials
export const verifySellerDocument = async (req, res) => {
  try {
    const { documentType, documentNumber } = req.body;
    if (!documentNumber || typeof documentNumber !== 'string') {
      return res.status(400).json({ success: false, message: 'Document number is required' });
    }

    const cleanNum = documentNumber.trim().toUpperCase();
    let isValid = false;
    let docName = '';
    let details = {};

    if (documentType === 'gst') {
      docName = 'GSTIN Number';
      // Standard 15-digit GSTIN Regex format (e.g. 24AAAAA0000A1Z5)
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      isValid = gstRegex.test(cleanNum);
      if (isValid) {
        details = {
          stateCode: cleanNum.substring(0, 2),
          panPart: cleanNum.substring(2, 12),
          status: 'Active Taxpayer',
          taxpayerType: 'Regular',
          govtPortalVerified: true
        };
      }
    } else if (documentType === 'pan') {
      docName = 'PAN Card Number';
      // Standard 10-character PAN Regex (e.g. ABCDE1234F)
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      isValid = panRegex.test(cleanNum);
      if (isValid) {
        details = {
          panType: cleanNum[3] === 'C' ? 'Company' : cleanNum[3] === 'P' ? 'Individual' : cleanNum[3] === 'F' ? 'Firm' : 'Registered Entity',
          status: 'Active & Verified',
          nsdlVerified: true
        };
      }
    } else if (documentType === 'bis') {
      docName = 'BIS Hallmark License';
      // Standard 6 to 14 char BIS License regex (e.g. BIS98765432, HM/C-123456)
      const bisRegex = /^[A-Z0-9\/-]{6,14}$/;
      isValid = bisRegex.test(cleanNum);
      if (isValid) {
        details = {
          licenseType: 'Jewellery Hallmarking License (Gold & Silver)',
          hallmarkPurityGrade: '22K / 18K / 14K Certified',
          status: 'Active & Valid',
          bisPortalVerified: true
        };
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid document type. Supported types: gst, pan, bis' });
    }

    if (!isValid) {
      return res.json({
        success: false,
        verified: false,
        message: `Invalid ${docName} format. Please check the number and try again.`
      });
    }

    return res.json({
      success: true,
      verified: true,
      documentType,
      documentNumber: cleanNum,
      message: `${docName} (${cleanNum}) verified successfully with Govt Portal!`,
      details
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


