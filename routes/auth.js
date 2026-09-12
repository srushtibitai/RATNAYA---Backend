import express from 'express';
import { signup, login, getCurrentUser } from '../controllers/authController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/signup - Insert New Account (BUYER / SELLER)
router.post('/signup', signup);

// POST /api/auth/login - Authenticate Credentials & Issue JWT Token
router.post('/login', login);

// GET /api/auth/me - Select Authenticated Profile
router.get('/me', verifyToken, getCurrentUser);

export default router;
