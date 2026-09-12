import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratnaya_db';

async function update() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB:', MONGODB_URI);

    const res = await mongoose.connection.db.collection('sellers').updateMany(
      {},
      {
        $set: {
          logo: '/uploads/avatar.jpg',
          banner: '/uploads/banner.jpg'
        }
      }
    );

    console.log('Updated sellers count:', res.modifiedCount);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Update error:', err);
    process.exit(1);
  }
}

update();
