import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

import fs from 'fs';

let cachedToken = null;
let tokenExpiresAt = null;

function getEnvCredentials() {
  let email = process.env.SHIPROCKET_EMAIL;
  let password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    const possiblePaths = [
      path.join(process.cwd(), '.env'),
      path.join(process.cwd(), 'backend', '.env'),
      path.join(__dirname, '../.env'),
      path.join(__dirname, '.env')
    ];
    for (const envPath of possiblePaths) {
      try {
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const emailMatch = envContent.match(/SHIPROCKET_EMAIL\s*=\s*(.*)/);
          const passMatch = envContent.match(/SHIPROCKET_PASSWORD\s*=\s*(.*)/);
          if (emailMatch && emailMatch[1]) email = emailMatch[1].replace(/\r/g, '').trim();
          if (passMatch && passMatch[1]) password = passMatch[1].replace(/\r/g, '').trim();
          if (email && password) break;
        }
      } catch (e) {}
    }
  }
  return { email, password };
}

/**
 * Shiprocket API Authentication - Fetches JWT Token
 */
export async function getShiprocketToken() {
  const { email, password } = getEnvCredentials();

  if (!email || !password) {
    console.warn('⚠️ SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD missing from .env');
    return null;
  }

  // Return cached token if still valid
  if (cachedToken && tokenExpiresAt && new Date() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok || !data.token) {
      console.error('Shiprocket Login Failed:', data);
      throw new Error(data.message || 'Shiprocket Auth Failed');
    }

    cachedToken = data.token;
    // Cache token for 9 days (Shiprocket tokens valid for 10 days)
    tokenExpiresAt = new Date(Date.now() + 9 * 24 * 60 * 60 * 1000);

    return cachedToken;
  } catch (err) {
    console.error('Shiprocket Token Error:', err.message);
    throw err;
  }
}

/**
 * Check Courier Serviceability & Delivery Rate Estimation
 */
export async function checkServiceability({ pickupPostcode = '302001', deliveryPostcode, weight = '0.5', cod = 0 }) {
  try {
    const token = await getShiprocketToken();
    if (!token) return { success: false, error: 'Shiprocket Credentials Not Configured' };

    const query = new URLSearchParams({
      pickup_postcode: pickupPostcode,
      delivery_postcode: deliveryPostcode,
      weight: String(weight),
      cod: String(cod)
    }).toString();

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/serviceability/?${query}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Create Order in Shiprocket for Shipment & AWB Generation
 */
export async function createShipment(orderData) {
  try {
    const token = await getShiprocketToken();
    if (!token) return { success: false, error: 'Shiprocket Credentials Not Configured' };

    const cleanPhone = orderData.phone ? String(orderData.phone).replace(/[^0-9]/g, '').slice(-10) : '9876543210';
    const custName = orderData.customerName || 'Patron Buyer';
    const nameParts = custName.trim().split(' ');
    const firstName = nameParts[0] || 'Patron';
    const lastName = nameParts.slice(1).join(' ') || 'Buyer';

    const payload = {
      order_id: orderData.orderId || `RATNAYA_${Date.now()}`,
      order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pickup_location: orderData.pickupLocation || 'Primary',
      channel_id: '',
      comment: 'RATNAYA Luxury Marketplace Order',
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: orderData.address || 'Flat 402, Sea Pearl Towers',
      billing_address_2: '',
      billing_city: orderData.city || 'Mumbai',
      billing_pincode: orderData.pincode || '400018',
      billing_state: orderData.state || 'Maharashtra',
      billing_country: 'India',
      billing_email: orderData.email || 'customer@ratnaya.com',
      billing_phone: cleanPhone,
      shipping_is_billing: true,
      shipping_customer_name: firstName,
      shipping_last_name: lastName,
      shipping_address: orderData.address || 'Flat 402, Sea Pearl Towers',
      shipping_address_2: '',
      shipping_city: orderData.city || 'Mumbai',
      shipping_pincode: orderData.pincode || '400018',
      shipping_state: orderData.state || 'Maharashtra',
      shipping_country: 'India',
      shipping_email: orderData.email || 'customer@ratnaya.com',
      shipping_phone: cleanPhone,
      order_items: (orderData.items || []).map((item) => ({
        name: item.name || 'Handcrafted Jewellery',
        sku: item.sku || item.id || 'RAT-JW-01',
        units: item.quantity || item.qty || 1,
        selling_price: item.price || 5000,
        discount: 0,
        tax: 0,
        hsn: 7113
      })),
      payment_method: orderData.paymentMethod === 'COD' ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: orderData.totalAmount || 5000,
      length: orderData.length || 10,
      breadth: orderData.breadth || orderData.width || 10,
      height: orderData.height || 10,
      weight: orderData.weight || 0.5
    };

    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Track Live Shipment Status by AWB Code
 */
export async function trackShipment(awbCode) {
  try {
    const token = await getShiprocketToken();
    if (!token) return { success: false, error: 'Shiprocket Credentials Not Configured' };

    const response = await fetch(`https://apiv2.shiprocket.in/v1/external/courier/track/awb/${encodeURIComponent(awbCode)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
