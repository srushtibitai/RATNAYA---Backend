import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Seller } from '../models/Seller.js';
import { UserProfile } from '../models/UserProfile.js';
import { db } from '../db/database.js';
import { isMongoReady } from '../config/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'ratnaya_super_secret_jwt_key_2026';

/**
 * Generate JWT Token Helper
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * POST /api/auth/signup - Register User / Seller
 */
export async function signup(req, res) {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = 'BUYER',
      businessName,
      gst,
      pan,
      bisLicense,
      city,
      gstDoc,
      panDoc,
      bisDoc,
      commissionRate = 10
    } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    if (!cleanEmail) {
      return res.status(400).json({ success: false, message: 'Email address is required' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || '123456', salt);

    const cleanGst = (gst || '').trim().toUpperCase();

    if (role.toUpperCase() === 'SELLER' && cleanGst) {
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
          console.warn('MongoDB Signup Seller GST Check Error:', err.message);
        }
      }

      const storeCheck = db.read();
      const existingMemorySeller = (storeCheck.sellers || []).find(
        (s) => s.gst && s.gst.trim().toUpperCase() === cleanGst
      );
      if (existingMemorySeller) {
        return res.status(400).json({
          success: false,
          message: `A seller with GSTIN "${cleanGst}" is already registered (${existingMemorySeller.name}). Duplicate GSTIN is not allowed.`
        });
      }
    }

    if (isMongoReady()) {
      try {
        const existingUser = await User.findOne({ email: cleanEmail });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: `An account with "${cleanEmail}" already exists. Please Sign In.`
          });
        }

        const newUser = new User({
          name: name || cleanEmail.split('@')[0],
          email: cleanEmail,
          password: hashedPassword,
          phone: phone || '',
          role: role.toUpperCase()
        });
        await newUser.save();

        const userId = newUser._id.toString();

        // Create User Profile
        await UserProfile.create({
          userId,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone || '',
          dob: '1995-01-01',
          anniversary: '2020-01-01',
          vipBadge: 'Ratnaya VIP Gold Connoisseur'
        });

        let sellerId = null;

        // If registering as SELLER
        if (role.toUpperCase() === 'SELLER') {
          sellerId = `seller-${userId}`;
          const sellerName = businessName || name || 'Jeweller Applicant';
          const cleanSellerName = sellerName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');

          const newSellerObj = {
            id: sellerId,
            name: sellerName,
            owner: name || sellerName,
            email: cleanEmail,
            phone: phone || '',
            city: city || '',
            rating: 5.0,
            reviewsCount: 0,
            productsCount: 0,
            verified: false,
            joinedDate: new Date().getFullYear().toString(),
            logo: '/uploads/avatar.jpg',
            banner: '/uploads/banner.jpg',
            about: '',
            gst: cleanGst,
            pan: (pan || '').trim().toUpperCase(),
            bisLicense: (bisLicense || '').trim().toUpperCase(),
            gstDoc: gstDoc || `/uploads/${cleanSellerName}_GST_Certificate.pdf`,
            panDoc: panDoc || `/uploads/${cleanSellerName}_PAN_Card.jpg`,
            bisDoc: bisDoc || `/uploads/${cleanSellerName}_BIS_Hallmark_License.pdf`,
            status: 'Pending Verification',
            commissionRate: Number(commissionRate) || 10,
            createdAt: new Date()
          };

          await Seller.create(newSellerObj);

          // Add to pendingSellers store fallback as well
          const store = db.read();
          store.pendingSellers = store.pendingSellers || [];
          if (!store.pendingSellers.find(s => s.id === sellerId || s.email === cleanEmail)) {
            store.pendingSellers.unshift({
              id: sellerId,
              name: sellerName,
              businessName: sellerName,
              ownerName: name || sellerName,
              email: cleanEmail,
              phone: phone || '',
              city: city || '',
              gst: cleanGst,
              pan: (pan || '').trim().toUpperCase(),
              bisLicense: (bisLicense || '').trim().toUpperCase(),
              gstDoc: gstDoc || `/uploads/${cleanSellerName}_GST_Certificate.pdf`,
              panDoc: panDoc || `/uploads/${cleanSellerName}_PAN_Card.jpg`,
              bisDoc: bisDoc || `/uploads/${cleanSellerName}_BIS_Hallmark_License.pdf`,
              appliedDate: new Date().toISOString().split('T')[0],
              status: 'Pending Verification'
            });
            db.write(store);
          }
        }


        const token = generateToken({
          id: userId,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          sellerId
        });

        return res.status(201).json({
          success: true,
          database: 'MongoDB',
          message: `${newUser.role} Account Created & Saved Successfully`,
          data: {
            id: userId,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            sellerId,
            token
          }
        });
      } catch (err) {
        console.warn('MongoDB Signup Error, using fallback:', err.message);
      }
    }

    // Fallback Store Signup
    const store = db.read();
    store.users = store.users || [];
    if (store.users.find(u => u.email === cleanEmail)) {
      return res.status(400).json({ success: false, message: `Account "${cleanEmail}" already exists.` });
    }

    const userId = `usr-${Date.now()}`;
    let sellerId = null;
    if (role.toUpperCase() === 'SELLER') {
      sellerId = `seller-${userId}`;
      store.sellers = store.sellers || [];
      store.sellers.unshift({
        id: sellerId,
        name: businessName || name,
        owner: name,
        email: cleanEmail,
        phone: phone || '',
        city: city || '',
        gst: gst || '',
        pan: pan || '',
        bisLicense: '',
        status: 'Pending Verification',
        commissionRate: Number(commissionRate) || 10
      });

      store.pendingSellers = store.pendingSellers || [];
      if (!store.pendingSellers.find(s => s.id === sellerId || s.email === cleanEmail)) {
        store.pendingSellers.unshift({
          id: sellerId,
          name: businessName || name,
          businessName: businessName || name,
          ownerName: name,
          email: cleanEmail,
          phone: phone || '',
          city: city || '',
          gst: gst || '',
          pan: pan || '',
          bisLicense: '',
          appliedDate: new Date().toISOString().split('T')[0],
          status: 'Pending Verification'
        });
      }
    }

    const userObj = {
      id: userId,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || '',
      role: role.toUpperCase(),
      sellerId
    };

    store.users.push(userObj);
    db.write(store);

    const token = generateToken({
      id: userId,
      email: cleanEmail,
      name: userObj.name,
      role: userObj.role,
      sellerId
    });

    res.status(201).json({
      success: true,
      database: 'Memory Store',
      message: `${userObj.role} Account Created Successfully`,
      data: {
        id: userId,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        sellerId,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Signup Error', error: error.message });
  }
}

/**
 * POST /api/auth/login - Authenticate User / Seller / Admin & Issue JWT Token
 */
export async function login(req, res) {
  try {
    const { email, password, role = 'BUYER' } = req.body;
    const cleanEmail = (email || '').toLowerCase().trim();

    // Admin Authentication
    if (role.toUpperCase() === 'ADMIN') {
      if (password === 'admin123' || password === 'ratnaya2026' || !password) {
        const token = generateToken({
          id: 'admin-1',
          name: 'Ratnaya Super Admin',
          email: cleanEmail || 'admin@ratnaya.com',
          role: 'ADMIN'
        });

        return res.json({
          success: true,
          message: 'Authenticated as Ratnaya Super Admin Governance',
          data: {
            id: 'admin-1',
            name: 'Ratnaya Super Admin',
            email: cleanEmail || 'admin@ratnaya.com',
            role: 'ADMIN',
            token
          }
        });
      } else {
        return res.status(401).json({ success: false, message: 'Invalid Admin Secret Key' });
      }
    }

    // MongoDB Lookup
    if (isMongoReady()) {
      try {
        const user = await User.findOne({ email: cleanEmail });
        if (user) {
          if (password && user.password) {
            let isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch && user.password === password) {
              isMatch = true; // backward compatibility for plain passwords
            }

            if (!isMatch) {
              return res.status(401).json({ success: false, message: 'Invalid password credentials' });
            }
          }

          let sellerId = null;
          if (user.role === 'SELLER') {
            const sellerObj = await Seller.findOne({ $or: [{ email: cleanEmail }, { owner: user.name }] }).lean();
            if (sellerObj) sellerId = sellerObj.id;
          }

          const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            sellerId
          });

          return res.json({
            success: true,
            database: 'MongoDB',
            message: `${user.role} Logged In Successfully`,
            data: {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              phone: user.phone,
              role: user.role,
              sellerId,
              token
            }
          });
        }
      } catch (err) {
        console.warn('MongoDB Login Query Error:', err.message);
      }
    }

    // Memory Store Fallback Lookup
    const store = db.read();
    const user = (store.users || []).find(u => u.email === cleanEmail);
    if (!user) {
      return res.status(404).json({ success: false, message: `No account found for "${cleanEmail}". Please signup.` });
    }

    if (password && user.password && user.password !== password) {
      const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
      if (!isMatch && user.password !== password) {
        return res.status(401).json({ success: false, message: 'Invalid password credentials' });
      }
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || role.toUpperCase(),
      sellerId: user.sellerId
    });

    return res.json({
      success: true,
      database: 'Memory Store',
      message: `${user.role || role} Logged In Successfully`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || role.toUpperCase(),
        sellerId: user.sellerId,
        token
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Login Error', error: error.message });
  }
}

/**
 * GET /api/auth/me - Get Authenticated User Profile
 */
export async function getCurrentUser(req, res) {
  res.json({
    success: true,
    user: req.user
  });
}
