import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { isMongoReady } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir1 = __dirname;
const dbDir2 = path.join(__dirname, '../data');

const dbFilePath1 = path.join(dbDir1, 'db.json');
const dbFilePath2 = path.join(dbDir2, 'db.json');

const defaultData = {
  products: [],
  sellers: [],
  orders: [],
  pendingSellers: [],
  pendingProducts: [],
  users: [],
  settings: { globalCommission: 10, globalGstRate: 3 }
};

function ensureDbFiles() {
  if (isMongoReady()) {
    // DO NOT CREATE OR MANTAIN JSON FILES WHEN MONGODB IS READY
    return;
  }

  [dbDir1, dbDir2].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (e) {}
    }
  });

  [dbFilePath1, dbFilePath2].forEach((fp) => {
    if (!fs.existsSync(fp)) {
      try {
        fs.writeFileSync(fp, JSON.stringify(defaultData, null, 2));
      } catch (e) {}
    }
  });
}

export const db = {
  read() {
    if (isMongoReady()) {
      return { ...defaultData };
    }
    ensureDbFiles();
    try {
      if (fs.existsSync(dbFilePath1)) {
        const raw = fs.readFileSync(dbFilePath1, 'utf-8');
        return { ...defaultData, ...JSON.parse(raw) };
      }
    } catch (e) {}

    try {
      if (fs.existsSync(dbFilePath2)) {
        const raw = fs.readFileSync(dbFilePath2, 'utf-8');
        return { ...defaultData, ...JSON.parse(raw) };
      }
    } catch (e) {}

    return { ...defaultData };
  },
  write(data) {
    if (isMongoReady()) {
      // DO NOT WRITE ANY JSON FILES ON DISK WHEN MONGODB IS READY
      return true;
    }
    ensureDbFiles();
    const payload = JSON.stringify(data, null, 2);
    [dbFilePath1, dbFilePath2].forEach((fp) => {
      try {
        fs.writeFileSync(fp, payload);
      } catch (e) {}
    });
    return true;
  }
};
