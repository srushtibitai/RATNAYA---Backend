import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const resendApiKey = process.env.RESEND_API_KEY;
const resend = new Resend(resendApiKey);

console.log('✉️  Resend Email Service is initialized and ready.');

/**
 * Common HTML Wrapper for Brand Aesthetics
 */
const getEmailWrapper = (title, contentHtml) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f1ea; margin: 0; padding: 20px; color: #222; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2d7c5; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    .header { background: #1a1612; color: #d4af37; padding: 25px 20px; text-align: center; border-bottom: 3px solid #d4af37; }
    .header h1 { margin: 0; font-size: 26px; letter-spacing: 2px; text-transform: uppercase; font-family: serif; }
    .header p { margin: 5px 0 0 0; font-size: 13px; color: #c5a059; text-transform: uppercase; letter-spacing: 1px; }
    .content { padding: 30px 25px; line-height: 1.6; }
    .title { font-size: 20px; font-weight: bold; color: #1a1612; margin-top: 0; margin-bottom: 15px; border-bottom: 2px solid #f0e6d2; padding-bottom: 10px; }
    .badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px; margin-bottom: 15px; }
    .badge-danger { background-color: #fde8e8; color: #9b1c1c; }
    .badge-success { background-color: #def7ec; color: #03543f; }
    .badge-info { background-color: #e1effe; color: #1e429f; }
    .badge-warning { background-color: #feecdc; color: #b45309; }
    .details-box { background: #fdfbf7; border-left: 4px solid #d4af37; padding: 15px; border-radius: 4px; margin: 20px 0; }
    .item-row { display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding: 10px 0; font-size: 14px; }
    .footer { background: #faf8f5; text-align: center; padding: 20px; font-size: 12px; color: #777; border-top: 1px solid #eee; }
    .footer a { color: #d4af37; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>RATNAYA</h1>
      <p>Luxury Jewellery Marketplace</p>
    </div>
    <div class="content">
      <h2 class="title">${title}</h2>
      ${contentHtml}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Ratnaya Jewellery Marketplace. All rights reserved.</p>
      <p>Need assistance? Contact our support at <a href="mailto:support@ratnaya.com">support@ratnaya.com</a></p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send Mail Helper using Resend API
 */
async function sendMail({ to, subject, html }) {
  console.log("Recipient Email:", to);
  if (!to) {
    console.warn(`⚠️ Cannot send email: No recipient email provided. Subject: "${subject}"`);
    return false;
  }

  try {
    const response = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    });

    if (response.error) {
      console.error(`❌ Resend API Error sending email to ${to}:`, response.error.message || response.error);
      return false;
    }

    console.log(`✅ Email sent successfully via Resend to ${to} [ID: ${response.data?.id}]`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email via Resend to ${to}:`, error.message);
    return false;
  }
}

/**
 * 1. Admin rejects Seller Account application
 */
export async function sendSellerRejectionEmail({ sellerEmail, sellerName, reason }) {
  const subject = `❌ Ratnaya Seller Application Update - Account Status`;
  const html = getEmailWrapper('Seller Application Decision', `
    <p>Dear <strong>${sellerName || 'Jeweller Partner'}</strong>,</p>
    <p>Thank you for submitting your application to sell on <strong>Ratnaya Marketplace</strong>.</p>
    <div class="badge badge-danger">Application Status: Rejected</div>
    <p>After reviewing your business registration details and compliance documents, our Admin team was unable to approve your seller account at this time.</p>
    <div class="details-box">
      <strong>Reason for Rejection:</strong>
      <p style="margin: 5px 0 0 0; color: #9b1c1c;">${reason || 'Document validation or business compliance criteria were not met.'}</p>
    </div>
    <p>If you believe this decision was made in error or if you wish to re-submit updated documents (GST/PAN/BIS license), please update your store application or contact our seller onboard team.</p>
    <p>Warm regards,<br><strong>Ratnaya Merchant Compliance Team</strong></p>
  `);

  return await sendMail({ to: sellerEmail, subject, html });
}

/**
 * 2. Admin rejects Seller Product
 */
export async function sendProductRejectionEmail({ sellerEmail, sellerName, productName, productId, reason }) {
  const subject = `❌ Product Listing Update: ${productName} - Ratnaya`;
  const html = getEmailWrapper('Product Review Update', `
    <p>Dear <strong>${sellerName || 'Jeweller Partner'}</strong>,</p>
    <p>Your product submission for <strong>"${productName}"</strong> (ID: <code>${productId}</code>) has been reviewed by the Ratnaya Quality Assurance team.</p>
    <div class="badge badge-danger">Product Status: Rejected</div>
    <p>Unfortunately, this product listing has been <strong>rejected</strong> and will not be displayed on the public storefront.</p>
    <div class="details-box">
      <strong>Rejection Reason:</strong>
      <p style="margin: 5px 0 0 0; color: #9b1c1c;">${reason || 'Product specifications or hallmark certification standards do not meet marketplace guidelines.'}</p>
    </div>
    <p>You may edit the product details, update pricing or purity certificates, and resubmit it for approval from your Seller Portal dashboard.</p>
    <p>Warm regards,<br><strong>Ratnaya Admin Quality Team</strong></p>
  `);

  return await sendMail({ to: sellerEmail, subject, html });
}

/**
 * 3. User Checkout (Order Placed) Confirmation
 */
export async function sendOrderConfirmationEmail(order) {
  const buyerEmail = order.buyerEmail;
  const subject = `✨ Order Confirmation - RATNAYA #${order.id}`;

  const itemsHtml = (order.items || []).map(item => `
    <div class="item-row">
      <span><strong>${item.name}</strong> (Qty: ${item.qty || 1})</span>
      <span>₹${(item.price * (item.qty || 1)).toLocaleString('en-IN')}</span>
    </div>
  `).join('');

  const html = getEmailWrapper('Order Confirmed!', `
    <p>Dear <strong>${order.buyerName || 'Valued Customer'}</strong>,</p>
    <p>Thank you for shopping with <strong>Ratnaya Luxury Jewellery Marketplace</strong>. Your order has been placed successfully!</p>
    
    <div class="badge badge-success">Order Status: Confirmed</div>

    <div class="details-box">
      <p style="margin: 0 0 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
      <p style="margin: 0 0 5px 0;"><strong>Order Date:</strong> ${order.date || new Date().toLocaleDateString()}</p>
      <p style="margin: 0 0 5px 0;"><strong>Tracking No:</strong> ${order.trackingNumber || 'N/A'}</p>
      <p style="margin: 0;"><strong>Payment Method:</strong> ${order.paymentMethod || 'Razorpay / Online'}</p>
    </div>

    <h3 style="font-size: 16px; margin-top: 20px;">Order Summary</h3>
    ${itemsHtml}
    
    <div style="text-align: right; margin-top: 15px; font-size: 18px; font-weight: bold; color: #d4af37;">
      Total Amount: ₹${Number(order.totalAmount || 0).toLocaleString('en-IN')}
    </div>

    <div class="details-box" style="margin-top: 20px;">
      <strong>Shipping Address:</strong>
      <p style="margin: 5px 0 0 0; font-size: 14px;">${order.address || 'Address provided at checkout'}</p>
    </div>

    <p>We will notify you as soon as your jewellery parcel is packaged and shipped!</p>
    <p>Warm regards,<br><strong>Ratnaya Concierge Team</strong></p>
  `);

  return await sendMail({ to: buyerEmail, subject, html });
}

/**
 * 4. Order Shipped Notification to Buyer
 */
export async function sendOrderShippedEmail(order) {
  const buyerEmail = order.buyerEmail;
  const subject = `🚚 Your Order Has Been Shipped! - RATNAYA #${order.id}`;

  const html = getEmailWrapper('Order Shipped & In Transit', `
    <p>Dear <strong>${order.buyerName || 'Valued Customer'}</strong>,</p>
    <p>Great news! Your luxury jewellery parcel for Order <strong>#${order.id}</strong> is now on its way to you.</p>
    
    <div class="badge badge-info">Status: Shipped</div>

    <div class="details-box">
      <p style="margin: 0 0 5px 0;"><strong>Carrier:</strong> BlueDart Express / Shiprocket Courier</p>
      <p style="margin: 0 0 5px 0;"><strong>Tracking Number:</strong> <span style="font-family: monospace; font-size: 16px; color: #1a1612;">${order.trackingNumber || 'BLUEDART-8891230'}</span></p>
      <p style="margin: 0;"><strong>Delivery Address:</strong> ${order.address || 'Delivery Address'}</p>
    </div>

    <p>Your item has been securely packed in tamper-proof insured packaging with BIS hallmark verification certificate.</p>
    <p>Warm regards,<br><strong>Ratnaya Logistics Team</strong></p>
  `);

  return await sendMail({ to: buyerEmail, subject, html });
}

/**
 * 5. Buyer Requests Return -> Notification to Seller
 */
export async function sendReturnRequestToSellerEmail({ sellerEmail, order, returnDetails }) {
  const subject = `⚠️ Return Requested for Order #${order.id} - RATNAYA`;

  const html = getEmailWrapper('Customer Return Request', `
    <p>Dear <strong>Seller Partner</strong>,</p>
    <p>A return request has been raised by customer <strong>${order.buyerName || 'Buyer'}</strong> for Order <strong>#${order.id}</strong>.</p>
    
    <div class="badge badge-warning">Return Status: Requested</div>

    <div class="details-box">
      <p style="margin: 0 0 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
      <p style="margin: 0 0 5px 0;"><strong>Request Date:</strong> ${returnDetails?.requestDate || new Date().toLocaleDateString()}</p>
      <p style="margin: 0 0 5px 0;"><strong>Return Reason:</strong> ${returnDetails?.reason || 'Not Specified'}</p>
      <p style="margin: 0;"><strong>Customer Comments:</strong> ${returnDetails?.comments || 'None'}</p>
    </div>

    <p>Please log in to your Seller Portal to review this return request and coordinate return pickup / verification.</p>
    <p>Warm regards,<br><strong>Ratnaya Seller Operations</strong></p>
  `);

  return await sendMail({ to: sellerEmail, subject, html });
}

/**
 * 6. Refund Processed -> Email to User
 */
export async function sendRefundCompletedEmail(order) {
  const buyerEmail = order.buyerEmail;
  const subject = `💰 Refund Processed - RATNAYA Order #${order.id}`;
  const refundInfo = order.refundDetails || {};

  const html = getEmailWrapper('Refund Processed Successfully', `
    <p>Dear <strong>${order.buyerName || 'Valued Customer'}</strong>,</p>
    <p>This is to confirm that your refund for Order <strong>#${order.id}</strong> has been processed successfully.</p>
    
    <div class="badge badge-success">Refund Status: Completed</div>

    <div class="details-box">
      <p style="margin: 0 0 5px 0;"><strong>Order ID:</strong> #${order.id}</p>
      <p style="margin: 0 0 5px 0;"><strong>Refund Amount:</strong> <strong style="color: #03543f; font-size: 16px;">₹${Number(refundInfo.refundAmount || order.totalAmount || 0).toLocaleString('en-IN')}</strong></p>
      <p style="margin: 0 0 5px 0;"><strong>Refund Transaction ID:</strong> <code>${refundInfo.refundTxnId || 'RFND-88912301'}</code></p>
      <p style="margin: 0 0 5px 0;"><strong>Refund Date:</strong> ${refundInfo.refundDate || new Date().toLocaleDateString()}</p>
      <p style="margin: 0;"><strong>Notes:</strong> ${refundInfo.notes || 'Amount refunded to original source / nominated bank account.'}</p>
    </div>

    <p>Depending on your bank/card issuer, the funds should reflect in your account within 3 to 5 business days.</p>
    <p>Warm regards,<br><strong>Ratnaya Accounts & Payments Team</strong></p>
  `);

  return await sendMail({ to: buyerEmail, subject, html });
}
