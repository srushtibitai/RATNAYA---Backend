import { Category } from '../models/Category.js';
import { db } from '../db/database.js';
import { isMongoReady } from '../config/db.js';

/**
 * GET /api/categories - Select All Categories
 */
export async function getCategories(req, res) {
  if (isMongoReady()) {
    try {
      const categories = await Category.find({}).lean();
      return res.json({ success: true, database: 'MongoDB', count: categories.length, data: categories });
    } catch (err) {
      console.warn('MongoDB Categories query error:', err.message);
    }
  }
  const store = db.read();
  res.json({ success: true, database: 'Memory Store', count: (store.categories || []).length, data: store.categories || [] });
}

/**
 * POST /api/categories - Insert New Category
 */
export async function addCategory(req, res) {
  const { name, slug, icon, banner, description } = req.body;

  if (isMongoReady()) {
    try {
      const newCat = new Category({ name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), icon, banner, description });
      await newCat.save();
      return res.status(201).json({ success: true, database: 'MongoDB', message: 'Category added successfully', data: newCat });
    } catch (err) {
      console.warn('MongoDB Add Category error:', err.message);
    }
  }

  const store = db.read();
  store.categories = store.categories || [];
  const catObj = { id: `cat-${Date.now()}`, name, slug: slug || name.toLowerCase().replace(/\s+/g, '-'), icon, banner, description };
  store.categories.push(catObj);
  db.write(store);
  res.status(201).json({ success: true, database: 'Memory Store', message: 'Category added successfully', data: catObj });
}
