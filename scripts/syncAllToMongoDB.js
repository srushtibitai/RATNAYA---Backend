import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratnaya_db';

const DEMO_SELLERS = [
  {
    id: 'seller-1',
    name: 'Kundan Jewels Jaipur',
    owner: 'Rajesh Sharma',
    city: 'Jaipur',
    rating: 4.9,
    reviewsCount: 142,
    productsCount: 18,
    verified: true,
    joinedDate: '2022',
    logo: '/uploads/avatar.jpg',
    banner: '/uploads/banner.jpg',
    about: 'Master craftsman of authentic royal Kundan and Meenakari heritage jewellery from Jaipur.',
    gst: '08AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    bisLicense: 'BIS-JPR-88912',
    gstDoc: '/uploads/Kundan_Atelier_GST_Certificate.pdf',
    panDoc: '/uploads/Kundan_Atelier_PAN_Card.pdf',
    bisDoc: '/uploads/Kundan_Atelier_BIS_Hallmark_License.pdf',
    status: 'Approved',
    commissionRate: 10
  },
  {
    id: 'seller-2',
    name: 'Veda Diamonds Mumbai',
    owner: 'Vikram Zaveri',
    city: 'Mumbai',
    rating: 4.8,
    reviewsCount: 98,
    productsCount: 14,
    verified: true,
    joinedDate: '2023',
    logo: '/uploads/avatar.jpg',
    banner: '/uploads/banner.jpg',
    about: 'Solitaire diamond jewellery crafted with IGI & GIA certified ethically sourced diamonds.',
    gst: '27BBBBB1111B2Z6',
    pan: 'BCDEF2345G',
    bisLicense: 'BIS-MUM-77210',
    gstDoc: '/uploads/VR_Jeweller_GST_Certificate.pdf',
    panDoc: '/uploads/VR_Jeweller_PAN_Card.pdf',
    bisDoc: '/uploads/VR_Jeweller_BIS_Hallmark_License.pdf',
    status: 'Approved',
    commissionRate: 10
  },
  {
    id: 'seller-3',
    name: 'Heritage Gold Kolkata',
    owner: 'Ananya Roy',
    city: 'Kolkata',
    rating: 4.95,
    reviewsCount: 210,
    productsCount: 24,
    verified: true,
    joinedDate: '2021',
    logo: '/uploads/avatar.jpg',
    banner: '/uploads/banner.jpg',
    about: 'Authentic 22K BIS Hallmarked handcrafted bridal gold necklaces & temple jewellery.',
    gst: '19CCCCC2222C3Z7',
    pan: 'CDEFG3456H',
    bisLicense: 'BIS-KOL-99124',
    gstDoc: '/uploads/GST_Certificate.pdf',
    panDoc: '/uploads/PAN_Card.jpg',
    bisDoc: '/uploads/BIS_Hallmark_License.pdf',
    status: 'Approved',
    commissionRate: 10
  }
];

async function sync() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('⚡ Connected to MongoDB for Full Data Sync:', MONGODB_URI);

    const sellersCol = mongoose.connection.db.collection('sellers');
    for (const seller of DEMO_SELLERS) {
      await sellersCol.updateOne(
        { id: seller.id },
        { $set: seller },
        { upsert: true }
      );
    }
    console.log('✅ Synchronized all Sellers to MongoDB');

    const ordersCol = mongoose.connection.db.collection('orders');
    const orderCount = await ordersCol.countDocuments();
    if (orderCount === 0) {
      await ordersCol.insertMany([
        {
          id: 'RAT-ORD-88219',
          date: '2026-08-28',
          buyerName: 'Priya Malhotra',
          buyerEmail: 'priya.m@gmail.com',
          buyerPhone: '9820144510',
          totalAmount: 245000,
          status: 'Delivered',
          trackingNumber: 'BLUEDART-8891230',
          sellerName: 'Heritage Gold Kolkata',
          items: [{ productId: 'prod-1', name: 'Gold Bangle Pair', price: 142000, qty: 1, sellerName: 'Heritage Gold Kolkata' }],
          paymentMethod: 'UPI (GPay)',
          address: 'Flat 402, Sea Pearl Towers, Worli, Mumbai 400018',
          createdAt: new Date()
        }
      ]);
      console.log('✅ Initialized Orders in MongoDB');
    } else {
      console.log(`✅ Existing MongoDB Orders count: ${orderCount}`);
    }

    console.log('🎉 Full MongoDB Sync Completed Successfully!');
  } catch (err) {
    console.error('❌ Sync Error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

sync();
