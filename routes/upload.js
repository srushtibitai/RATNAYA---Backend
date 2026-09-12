import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseAssetsDir = path.join(__dirname, '../public/assets');

// Helper to normalize category name to clean folder name
function getCategoryFolderName(catName) {
  if (!catName || typeof catName !== 'string') return 'general';
  const lower = catName.trim().toLowerCase();
  if (lower.includes('necklace')) return 'necklace';
  if (lower.includes('earring')) return 'earrings';
  if (lower.includes('ring')) return 'ring';
  if (lower.includes('bangle') || lower.includes('bracelet') || lower.includes('breslate') || lower.includes('breslet')) return 'bracelet';
  if (lower.includes('pendant')) return 'pendants';
  if (lower.includes('mangalsutra')) return 'mangalsutra';
  if (lower.includes('kundan') || lower.includes('polki')) return 'kundan';
  
  return lower.replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_') || 'general';
}

const uploadsDir = path.join(__dirname, '../public/uploads');

// Multer Storage Engine - Saves compliance docs / PDFs to /uploads/ and product images to /assets/jewellery/<categoryName>/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const rawCategory = req.body?.category || req.query?.category || req.headers?.['x-category'] || '';
    const sellerName = req.body?.sellerName || req.query?.sellerName || req.headers?.['x-seller-name'] || '';
    const docType = req.body?.docType || req.query?.docType || req.headers?.['x-doc-type'] || '';
    const ext = path.extname(file.originalname).toLowerCase();
    const isPdf = ext === '.pdf' || file.mimetype === 'application/pdf';

    const isComplianceDoc = isPdf || rawCategory === 'documents' || rawCategory === 'kyc' || rawCategory === 'compliance' || (!!docType && docType !== '');

    if (isComplianceDoc) {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      return cb(null, uploadsDir);
    }

    const folderName = getCategoryFolderName(rawCategory || 'bracelet');
    const categoryDir = path.join(baseAssetsDir, 'jewellery', folderName);
    if (!fs.existsSync(categoryDir)) {
      fs.mkdirSync(categoryDir, { recursive: true });
    }
    cb(null, categoryDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const rawCategory = req.body?.category || req.query?.category || req.headers?.['x-category'] || '';
    const sellerName = req.body?.sellerName || req.query?.sellerName || req.headers?.['x-seller-name'] || '';
    const docType = req.body?.docType || req.query?.docType || req.headers?.['x-doc-type'] || '';
    const isPdf = ext.toLowerCase() === '.pdf' || file.mimetype === 'application/pdf';

    const isComplianceDoc = isPdf || rawCategory === 'documents' || rawCategory === 'kyc' || rawCategory === 'compliance' || (!!docType && docType !== '');

    if (isComplianceDoc) {
      const cleanSeller = sellerName ? sellerName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '') : 'Seller';
      const cleanDoc = docType ? docType.replace(/[^a-zA-Z0-9]/g, '_') : path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
      const uniqueName = `${cleanSeller}_${cleanDoc}${ext}`;
      return cb(null, uniqueName);
    }

    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const uniqueName = `jewel_${Date.now()}_${cleanName.slice(0, 15)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB Max
});

const router = express.Router();

// POST /api/upload (Single File Upload -> returns category-wise server asset path)
router.post('/', (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('❌ Multer Upload Error on Server:', err.message);
      return res.status(400).json({ success: false, message: `Upload failed: ${err.message}` });
    }

    try {
      if (!req.file) {
        console.warn('⚠️ Upload route called but req.file is empty');
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const rawCategory = req.body?.category || req.query?.category || req.headers?.['x-category'] || '';
      const sellerName = req.body?.sellerName || req.query?.sellerName || req.headers?.['x-seller-name'] || '';
      const docType = req.body?.docType || req.query?.docType || req.headers?.['x-doc-type'] || '';
      const ext = path.extname(req.file.originalname).toLowerCase();
      const isPdf = ext === '.pdf' || req.file.mimetype === 'application/pdf';

      const isComplianceDoc = isPdf || rawCategory === 'documents' || rawCategory === 'kyc' || rawCategory === 'compliance' || (!!docType && docType !== '');
      const folderName = getCategoryFolderName(rawCategory || 'bracelet');

      const fileUrl = isComplianceDoc
        ? `/uploads/${req.file.filename}`
        : `/assets/jewellery/${folderName}/${req.file.filename}`;

      console.log(`✅ [SERVER UPLOAD SUCCESS] Saved to backend [${isComplianceDoc ? 'public/uploads' : folderName}]: ${fileUrl}`);

      return res.json({
        success: true,
        message: `File uploaded successfully: ${req.file.filename}`,
        url: fileUrl,
        filename: req.file.filename,
        categoryFolder: isComplianceDoc ? 'uploads' : folderName
      });
    } catch (catchErr) {
      console.error('❌ Server Upload Processing Error:', catchErr);
      return res.status(500).json({ success: false, error: catchErr.message });
    }
  });
});

export default router;
