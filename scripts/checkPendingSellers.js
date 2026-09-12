import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratnaya_db';

async function check() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('--- MongoDB Sellers ---');
    const sellers = await mongoose.connection.db.collection('sellers').find({}).toArray();
    sellers.forEach(s => {
      console.log(`ID: ${s.id || s._id}, Name: ${s.name}, Status: ${s.status}, Email: ${s.email}`);
    });

    console.log('--- DB JSON Pending Sellers ---');
    const dbPath = path.join(__dirname, '../db/db.json');
    if (fs.existsSync(dbPath)) {
      const store = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log(store.pendingSellers);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

check();
