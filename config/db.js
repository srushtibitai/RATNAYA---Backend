import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratnaya_db';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return true;
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log('🍃 MongoDB Connected Successfully to:', MONGODB_URI);
    return true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection warning:', error.message);
    console.warn('⚡ Using memory / db.json driver mode fallback.');
    isConnected = false;
    return false;
  }
}

export function isMongoReady() {
  return isConnected && mongoose.connection.readyState === 1;
}
