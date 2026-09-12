import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ratnaya_db';
const uploadsDir = path.join(__dirname, '../public/uploads');

const fileMappings = [
  { old: 'jewel_1789018958937_gstno_reg_wise_.pdf', new: 'VR_Jeweller_GST_Certificate.pdf' },
  { old: 'jewel_1789018964521_pancard.jpg', new: 'VR_Jeweller_PAN_Card.jpg' },
  { old: 'jewel_1789018968937_brief_on_hallma.pdf', new: 'VR_Jeweller_BIS_Hallmark_License.pdf' }
];

fileMappings.forEach(({ old, new: newName }) => {
  const oldPath = path.join(uploadsDir, old);
  const newPath = path.join(uploadsDir, newName);
  if (fs.existsSync(oldPath)) {
    fs.copyFileSync(oldPath, newPath);
    console.log(`✅ Renamed/Copied: ${old} -> ${newName}`);
  }
});

async function updateDB() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for Seller File Path update...');

    const sellersCol = mongoose.connection.db.collection('sellers');
    await sellersCol.updateMany(
      { name: /VR Jeweller/i },
      {
        $set: {
          gstDoc: '/uploads/VR_Jeweller_GST_Certificate.pdf',
          panDoc: '/uploads/VR_Jeweller_PAN_Card.jpg',
          bisDoc: '/uploads/VR_Jeweller_BIS_Hallmark_License.pdf'
        }
      }
    );
    console.log('✅ Updated VR Jeweller document paths in MongoDB');
  } catch (e) {
    console.error(e);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateDB();
