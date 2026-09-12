import { Blog } from '../models/Blog.js';

/**
 * GET /api/blogs - Select All Blogs or Filter by Category
 */
export async function getBlogs(req, res) {
  try {
    const { category } = req.query;
    let query = {};
    if (category && category !== 'All') {
      query.category = { $regex: new RegExp(`^${category.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') };
    }
    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: blogs.length, data: blogs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blogs', error: error.message });
  }
}

/**
 * GET /api/blogs/:id - Select Single Blog by ID or Slug
 */
export async function getBlogById(req, res) {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog post not found' });
    }
    res.json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching blog details', error: error.message });
  }
}

/**
 * POST /api/blogs - Insert New Blog Post
 */
export async function createBlog(req, res) {
  try {
    const newBlog = new Blog(req.body);
    await newBlog.save();
    res.status(201).json({ success: true, message: 'Blog post created successfully', data: newBlog });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error creating blog post', error: error.message });
  }
}

/**
 * PUT /api/blogs/:id - Update Blog Post
 */
export async function updateBlog(req, res) {
  try {
    const updated = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, message: 'Blog post updated successfully', data: updated });
  } catch (error) {
    res.status(400).json({ success: false, message: 'Error updating blog post', error: error.message });
  }
}

/**
 * DELETE /api/blogs/:id - Delete Blog Post
 */
export async function deleteBlog(req, res) {
  try {
    await Blog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting blog post', error: error.message });
  }
}
