import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import productsRoutes from './routes/products.js';
import sellersRoutes from './routes/sellers.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import categoriesRoutes from './routes/categories.js';
import authRoutes from './routes/auth.js';
import mastersRoutes from './routes/masters.js';
import paymentRoutes from './routes/payment.js';
import blogsRoutes from './routes/blogs.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import bannersRoutes from './routes/banners.js';
import profileRoutes from './routes/profile.js';
import uploadRoutes from './routes/upload.js';
import shippingRoutes from './routes/shipping.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env'), override: true });



const app = express();
const PORT = process.env.PORT || 5050;

// Connect to MongoDB Database immediately
await connectDB();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes
app.use('/api/products', productsRoutes);
app.use('/api/sellers', sellersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/masters', mastersRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/blogs', blogsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/banners', bannersRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/shipping', shippingRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'RATNAYA Multi-Vendor Jewellery Marketplace API (Render Deployment Ready)',
    timestamp: new Date().toISOString()
  });
});

// Serve Backend public/assets & public/uploads
const assetsPath = path.join(__dirname, 'public/assets');
if (!fs.existsSync(assetsPath)) {
  fs.mkdirSync(assetsPath, { recursive: true });
}
app.use('/assets', express.static(assetsPath));

const uploadsPath = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads', (req, res) => {
  const fileName = req.path.replace(/^\//, '');
  const legacyPath = path.join(__dirname, 'public/assets/jewellery/general', fileName);
  if (fs.existsSync(legacyPath)) {
    return res.sendFile(legacyPath);
  }
  res.status(404).send(`Compliance File / Upload "${req.path}" was not found on server.`);
});

// Serve Frontend Vite Static Assets in Production
// const distPath = path.join(__dirname, '../frontend/dist');
// app.use(express.static(distPath));

// Serve Frontend public assets fallback for /assets
const publicPath = path.join(__dirname, '../frontend/public');
app.use('/assets', express.static(path.join(publicPath, 'assets')));

// SPA Catch-All Route fallback for frontend client routing
// app.get('*', (req, res) => {
//   res.sendFile(path.join(distPath, 'index.html'));
// });

const server = app.listen(PORT, async () => {
  console.log(`✨ RATNAYA Fullstack Server is running on http://localhost:${PORT}`);
  await connectDB();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`⚠️ Port ${PORT} is currently in use. Retrying or waiting for free port...`);
  } else {
    console.error('Server error:', err);
  }
});
