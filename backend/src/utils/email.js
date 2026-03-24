const nodemailer = require('nodemailer');
const config = require('../config');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
};

/**
 * Send an email.
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  console.log(`Attempting to send email to ${to} with subject: ${subject}`);
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: config.smtp.from,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send a password-reset email.
 * @param {string} to        Recipient email
 * @param {string} resetUrl  Full URL with token
 */
const sendPasswordResetEmail = async (to, resetUrl) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#2563eb;">MediReach — Password Reset</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Click the button below to proceed:</p>
      <a href="${resetUrl}"
         style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;
                text-decoration:none;border-radius:6px;margin:16px 0;">
        Reset Password
      </a>
      <p style="font-size:13px;color:#666;">
        If you did not request this, please ignore this email. The link will expire in 1 hour.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="font-size:12px;color:#999;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;

  await sendEmail({ to, subject: 'Reset your MediReach password', html });
};

/**
 * Send a password-reset OTP code via email.
 * @param {string} to    Recipient email
 * @param {string} code  6-digit OTP code
 */
const sendPasswordResetCode = async (to, code) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
      <h2 style="color:#2563eb;">MediReach — Password Reset Code</h2>
      <p>Hello,</p>
      <p>We received a request to reset your password. Use the code below to proceed:</p>
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;padding:16px 32px;background:#f0f7ff;border:2px dashed #2563eb;
                     border-radius:10px;font-size:32px;font-weight:bold;letter-spacing:8px;color:#2563eb;">
          ${code}
        </span>
      </div>
      <p style="font-size:14px;color:#333;">
        Enter this code on the password reset page to set a new password.
      </p>
      <p style="font-size:13px;color:#666;">
        If you did not request this, please ignore this email. The code will expire in 1 hour.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="font-size:12px;color:#999;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;

  await sendEmail({ to, subject: 'Your MediReach Password Reset Code', html });
};

/**
 * Send an order confirmation email to the customer.
 * @param {string} to           Customer email
 * @param {object} order        Formatted order object
 * @param {Array}  items        Array of order items
 */
const sendOrderConfirmationEmail = async (to, order, items = []) => {
  const itemRows = items.map(
    (item) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${item.medicineName || item.medicine_name}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">Rs ${parseFloat(item.unitPrice || item.unit_price).toFixed(2)}</td>
        <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">Rs ${parseFloat(item.totalPrice || item.total_price).toFixed(2)}</td>
      </tr>`
  ).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#059669;padding:20px 24px;border-radius:10px;margin-bottom:24px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">✅ Order Confirmed!</h1>
        <p style="color:#d1fae5;margin:6px 0 0;">Thank you for shopping with MediReach</p>
      </div>

      <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:16px;border:1px solid #e5e7eb;">
        <h2 style="font-size:16px;color:#111827;margin:0 0 12px;">Order Details</h2>
        <p style="margin:4px 0;color:#374151;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin:4px 0;color:#374151;"><strong>Payment Method:</strong> ${(order.paymentMethod || '').toUpperCase()}</p>
        <p style="margin:4px 0;color:#374151;"><strong>Shipping Address:</strong> ${order.shippingAddress || 'N/A'}</p>
        <p style="margin:4px 0;color:#374151;"><strong>Shipping Phone:</strong> ${order.shippingPhone || 'N/A'}</p>
      </div>

      <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:16px;border:1px solid #e5e7eb;">
        <h2 style="font-size:16px;color:#111827;margin:0 0 12px;">Items Ordered</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;">
              <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Medicine</th>
              <th style="text-align:center;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Qty</th>
              <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Unit Price</th>
              <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>

      <div style="background:#fff;border-radius:10px;padding:20px 24px;margin-bottom:16px;border:1px solid #e5e7eb;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="color:#6b7280;padding:4px 0;">Subtotal</td><td style="text-align:right;">Rs ${parseFloat(order.subtotal).toFixed(2)}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Tax (13%)</td><td style="text-align:right;">Rs ${parseFloat(order.tax).toFixed(2)}</td></tr>
          <tr><td style="color:#6b7280;padding:4px 0;">Delivery Fee</td><td style="text-align:right;">Rs ${parseFloat(order.deliveryFee).toFixed(2)}</td></tr>
          <tr style="font-weight:bold;font-size:16px;">
            <td style="padding-top:8px;border-top:2px solid #e5e7eb;color:#111827;">Grand Total</td>
            <td style="text-align:right;padding-top:8px;border-top:2px solid #e5e7eb;color:#059669;">Rs ${parseFloat(order.grandTotal).toFixed(2)}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:13px;color:#6b7280;text-align:center;margin-top:24px;">
        You can track your order status by visiting the <strong>My Orders</strong> section.<br/>
        If you have any questions, contact us at <a href="mailto:medisupport@gmail.com" style="color:#059669;">medisupport@gmail.com</a>
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;

  await sendEmail({ to, subject: `MediReach — Order ${order.orderNumber} Confirmed! 🎉`, html });
};

/**
 * Send an order status update email to the customer.
 * @param {string} to          Customer email
 * @param {string} orderNumber
 * @param {string} newStatus   The new order status
 */
const sendOrderStatusUpdateEmail = async (to, orderNumber, newStatus) => {
  const statusLabels = {
    verified: 'Verified ✅',
    packed: 'Packed & Ready 📦',
    shipped: 'Shipped 🚚',
    delivered: 'Delivered 🏠',
    cancelled: 'Cancelled ❌',
  };
  const statusLabel = statusLabels[newStatus] || newStatus;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#059669;padding:20px 24px;border-radius:10px;margin-bottom:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Order Update 📋</h1>
      </div>
      <div style="background:#fff;border-radius:10px;padding:20px 24px;border:1px solid #e5e7eb;">
        <p style="color:#374151;">Your order <strong>${orderNumber}</strong> has been updated to:</p>
        <p style="font-size:22px;font-weight:bold;color:#059669;text-align:center;margin:16px 0;">${statusLabel}</p>
        <p style="font-size:13px;color:#6b7280;">
          Track your order live in the <strong>My Orders</strong> section of your MediReach account.
        </p>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;

  await sendEmail({ to, subject: `MediReach — Order ${orderNumber} Status: ${statusLabel}`, html });
};

/**
 * Send a welcome email after registration.
 * @param {string} to    Recipient email
 * @param {string} name  Recipient name
 */
const sendWelcomeEmail = async (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#059669;padding:20px 24px;border-radius:10px;margin-bottom:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:22px;">Welcome to MediReach! 💊</h1>
      </div>
      <div style="background:#fff;border-radius:10px;padding:24px;border:1px solid #e5e7eb;">
        <p style="font-size:16px;color:#374151;">Hello <strong>${name}</strong>,</p>
        <p style="color:#374151;line-height:1.5;">
          We're excited to have you join MediReach. Your account has been successfully created.
          You can now browse medicines, upload prescriptions, and manage your health more easily than ever.
        </p>
        <div style="text-align:center;margin-top:24px;">
          <a href="${config.clientUrl}" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Start Shopping</a>
        </div>
      </div>
      <p style="font-size:13px;color:#6b7280;text-align:center;margin-top:24px;">
        If you have any questions, feel free to reply to this email or contact support.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;
  await sendEmail({ to, subject: 'Welcome to MediReach! 🎉', html });
};

/**
 * Send a profile update confirmation.
 * @param {string} to    Recipient email
 * @param {string} name  Recipient name
 */
const sendProfileUpdateEmail = async (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#059669;padding:20px 24px;border-radius:10px;margin-bottom:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Profile Updated 👤</h1>
      </div>
      <div style="background:#fff;border-radius:10px;padding:24px;border:1px solid #e5e7eb;">
        <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
        <p style="color:#374151;line-height:1.5;">
          This is a confirmation that your MediReach profile has been successfully updated.
        </p>
        <p style="font-size:13px;color:#6b7280;margin-top:16px;">
          If you did not make this change, please contact our support team immediately.
        </p>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;
  await sendEmail({ to, subject: 'MediReach Profile Updated', html });
};

/**
 * Send a password change confirmation.
 * @param {string} to    Recipient email
 * @param {string} name  Recipient name
 */
const sendPasswordChangedEmail = async (to, name) => {
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#ef4444;padding:20px 24px;border-radius:10px;margin-bottom:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Security Alert: Password Changed 🔒</h1>
      </div>
      <div style="background:#fff;border-radius:10px;padding:24px;border:1px solid #e5e7eb;">
        <p style="color:#374151;">Hello <strong>${name}</strong>,</p>
        <p style="color:#374151;line-height:1.5;">
          Your MediReach account password was recently changed.
        </p>
        <div style="background:#fff7ed;border-left:4px solid #f97316;padding:12px;margin:16px 0;">
          <p style="margin:0;font-size:13px;color:#9a3412;">
            <strong>Important:</strong> If you did not change your password, someone may have accessed your account. 
            Please reset your password immediately or contact support.
          </p>
        </div>
      </div>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;
  await sendEmail({ to, subject: 'Security Alert: Your MediReach password was changed', html });
};

function renderTableRows(rows, renderer) {
  return rows.map(renderer).join('');
}

/**
 * Send inventory alert email to admin/pharmacist.
 * Supports low stock + near-expiry alerts in one email.
 * @param {string} to
 * @param {{lowStock?: Array<{name:string, stock:number}>, nearExpiry?: Array<{name:string, expiryDate:string, daysLeft:number}>}} payload
 */
const sendInventoryAlertEmail = async (to, payload = {}) => {
  const lowStock = payload.lowStock || [];
  const nearExpiry = payload.nearExpiry || [];
  if (!lowStock.length && !nearExpiry.length) return;

  const lowStockSection = lowStock.length
    ? `
      <div style="background:#fff;border-radius:10px;padding:20px 24px;border:1px solid #e5e7eb;margin-bottom:14px;">
        <h2 style="font-size:16px;color:#111827;margin:0 0 8px;">Low Stock Medicines</h2>
        <p style="color:#374151;line-height:1.5;margin:0 0 10px;">
          These medicines are below the stock threshold and need restocking.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;">
              <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Medicine</th>
              <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Stock Left</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(
              lowStock,
              (medicine) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${medicine.name}</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${medicine.stock}</td>
                </tr>`
            )}
          </tbody>
        </table>
      </div>`
    : '';

  const nearExpirySection = nearExpiry.length
    ? `
      <div style="background:#fff;border-radius:10px;padding:20px 24px;border:1px solid #e5e7eb;">
        <h2 style="font-size:16px;color:#111827;margin:0 0 8px;">Expiry Alert (Within 30 Days)</h2>
        <p style="color:#374151;line-height:1.5;margin:0 0 10px;">
          These medicines are approaching expiry and should be reviewed.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="color:#6b7280;font-size:12px;text-transform:uppercase;">
              <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Medicine</th>
              <th style="text-align:left;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Expiry Date</th>
              <th style="text-align:right;padding-bottom:8px;border-bottom:2px solid #e5e7eb;">Days Left</th>
            </tr>
          </thead>
          <tbody>
            ${renderTableRows(
              nearExpiry,
              (medicine) => `
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${medicine.name}</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;">${medicine.expiryDate}</td>
                  <td style="padding:8px 0;border-bottom:1px solid #f0f0f0;text-align:right;">${medicine.daysLeft}</td>
                </tr>`
            )}
          </tbody>
        </table>
      </div>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px;">
      <div style="background:#b45309;padding:18px 22px;border-radius:10px;margin-bottom:20px;text-align:center;">
        <h1 style="color:#fff;margin:0;font-size:20px;">Inventory Alert ⚠️</h1>
      </div>
      ${lowStockSection}
      ${nearExpirySection}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />
      <p style="font-size:12px;color:#999;text-align:center;">&copy; MediReach Online Pharmacy</p>
    </div>
  `;

  await sendEmail({
    to,
    subject: 'MediReach — Inventory Alert',
    html,
  });
};

const sendLowStockAlertEmail = async (to, medicines = []) =>
  sendInventoryAlertEmail(to, { lowStock: medicines });

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordResetCode,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendWelcomeEmail,
  sendProfileUpdateEmail,
  sendPasswordChangedEmail,
  sendInventoryAlertEmail,
  sendLowStockAlertEmail,
};

