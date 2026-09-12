import express from 'express';
import { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog } from '../controllers/blogController.js';

const router = express.Router();

// GET /api/blogs - Select All Blogs or Filter by Category
router.get('/', getBlogs);

// GET /api/blogs/:id - Select Single Blog by ID
router.get('/:id', getBlogById);

// POST /api/blogs - Insert New Blog Post
router.post('/', createBlog);

// PUT /api/blogs/:id - Update Blog Post
router.put('/:id', updateBlog);

// DELETE /api/blogs/:id - Delete Blog Post
router.delete('/:id', deleteBlog);

export default router;
