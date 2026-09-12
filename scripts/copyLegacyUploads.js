import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../public/uploads');
const generalDir = path.join(__dirname, '../public/assets/jewellery/general');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (fs.existsSync(generalDir)) {
  const files = fs.readdirSync(generalDir);
  files.forEach((file) => {
    const src = path.join(generalDir, file);
    const dest = path.join(uploadsDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied legacy upload to /uploads/: ${file}`);
    }
  });
}

console.log('🎉 Legacy files copied to /uploads/ successfully!');
