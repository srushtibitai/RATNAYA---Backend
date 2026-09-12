import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getShiprocketToken,
  checkServiceability,
  createShipment,
  trackShipment
} from '../services/shiprocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const router = express.Router();

// GET /api/shipping/status (Check integration status)
router.get('/status', async (req, res) => {
  try {
    const token = await getShiprocketToken();
    if (token) {
      return res.json({
        success: true,
        status: 'online',
        deliveryPartner: 'Shiprocket API Connected',
        message: 'Shiprocket Delivery Partner API is ready for shipment creation & live tracking'
      });
    } else {
      return res.json({
        success: false,
        status: 'unconfigured',
        deliveryPartner: 'Shiprocket API',
        message: 'SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD missing in backend .env'
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: err.message,
      message: 'Shiprocket authentication test failed. Please verify API User credentials.'
    });
  }
});

// POST /api/shipping/check-serviceability (Check pincode & shipping cost)
router.post('/check-serviceability', async (req, res) => {
  try {
    const { pickupPostcode = '302001', deliveryPostcode, weight = 0.5, cod = 0 } = req.body;

    if (!deliveryPostcode) {
      return res.status(400).json({ success: false, error: 'deliveryPostcode is required' });
    }

    const result = await checkServiceability({
      pickupPostcode,
      deliveryPostcode,
      weight,
      cod
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shipping/create-order (Create Shiprocket Shipment Order)
router.post('/create-order', async (req, res) => {
  try {
    const orderData = req.body;
    const result = await createShipment(orderData);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/shipping/track/:awb (Track Live AWB Shipment)
router.get('/track/:awb', async (req, res) => {
  try {
    const { awb } = req.params;
    const result = await trackShipment(awb);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
