// Email service stub for OTP and notification functionality
const nodemailer = require('nodemailer');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP via email
const sendOTPEmail = async (email, otp) => {
  console.log(`📧 Sending OTP ${otp} to ${email}`);
  
  // In a real implementation, you would use nodemailer to send the email
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your One-Time Password (OTP) is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 5 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send OTP email:', error);
    // For development, we'll just log it instead of throwing
    console.log(`📧 (Development mode) OTP ${otp} for ${email}`);
  }
};

// Send OTP via SMS
const sendOTPSMS = async (phone, otp) => {
  console.log(`📱 Sending OTP ${otp} to ${phone}`);
  
  // In a real implementation, you would use Twilio or similar service
  // For development, we'll just log it
  console.log(`📱 (Development mode) SMS OTP ${otp} for ${phone}`);
};

// Send welcome email
const sendWelcomeEmail = async (email, name) => {
  console.log(`📧 Sending welcome email to ${email}`);
  
  // For development, just log it
  console.log(`📧 (Development mode) Welcome email for ${name} at ${email}`);
};

// Send password reset email
const sendPasswordResetEmail = async (email, resetToken) => {
  console.log(`📧 Sending password reset email to ${email}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset</h2>
        <p>You requested to reset your password. Click the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy this link: ${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    console.log(`📧 (Development mode) Reset link: ${resetLink}`);
  }
};

// Send order confirmation email
const sendOrderConfirmationEmail = async (email, orderDetails) => {
  console.log(`📧 Sending order confirmation to ${email}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const { orderId, items, orderAmount, deliveryAddress, expectedTime } = orderDetails;
  
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.variation.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: `Order Confirmation - #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">Order Confirmed! 🎉</h2>
        <p>Thank you for your order. We're preparing it now!</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Order #${orderId}</h3>
          <p><strong>Delivery Address:</strong> ${deliveryAddress}</p>
          <p><strong>Expected Delivery:</strong> ${expectedTime}</p>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f4f4f4;">
              <th style="padding: 10px; text-align: left;">Item</th>
              <th style="padding: 10px; text-align: center;">Qty</th>
              <th style="padding: 10px; text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold;">Total:</td>
              <td style="padding: 15px; text-align: right; font-weight: bold; color: #FF6B35;">$${orderAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        
        <p>You can track your order in the app.</p>
        <p>Questions? Contact us at support@yourapp.com</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order confirmation sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send order confirmation:', error);
  }
};

// Send order status update email
const sendOrderStatusEmail = async (email, orderDetails) => {
  console.log(`📧 Sending order status update to ${email}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const { orderId, orderStatus, riderName, riderPhone } = orderDetails;
  
  const statusMessages = {
    ACCEPTED: { title: 'Order Accepted', message: 'Your order has been accepted and is being prepared.', icon: '✅' },
    ASSIGNED: { title: 'Rider Assigned', message: `${riderName} will deliver your order.`, icon: '🚴' },
    PICKED: { title: 'Order Picked Up', message: 'Your order is on the way!', icon: '📦' },
    DELIVERED: { title: 'Order Delivered', message: 'Your order has been delivered. Enjoy!', icon: '🎉' },
    CANCELLED: { title: 'Order Cancelled', message: 'Your order has been cancelled.', icon: '❌' }
  };
  
  const status = statusMessages[orderStatus] || statusMessages.ACCEPTED;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: `${status.title} - Order #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${status.icon} ${status.title}</h2>
        <p>${status.message}</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Order #${orderId}</h3>
          <p><strong>Status:</strong> ${orderStatus}</p>
          ${riderName ? `<p><strong>Rider:</strong> ${riderName}</p>` : ''}
          ${riderPhone ? `<p><strong>Contact:</strong> ${riderPhone}</p>` : ''}
        </div>
        
        <p>Track your order in real-time in the app.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Order status email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send order status email:', error);
  }
};

// Send rider assignment notification
const sendRiderAssignmentEmail = async (email, orderDetails) => {
  console.log(`📧 Sending rider assignment notification to ${email}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const { orderId, shopName, deliveryAddress, orderAmount } = orderDetails;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: `New Delivery Assignment - Order #${orderId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>🚴 New Delivery Assignment</h2>
        <p>You have been assigned a new delivery order.</p>
        
        <div style="background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3>Order #${orderId}</h3>
          <p><strong>Pickup:</strong> ${shopName}</p>
          <p><strong>Delivery:</strong> ${deliveryAddress}</p>
          <p><strong>Amount:</strong> $${orderAmount.toFixed(2)}</p>
        </div>
        
        <p>Open the rider app to accept and start delivery.</p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Rider assignment email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send rider assignment email:', error);
  }
};

// Send promotional email
const sendPromotionalEmail = async (email, promoDetails) => {
  console.log(`📧 Sending promotional email to ${email}`);
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const { title, message, couponCode, discountValue, validUntil } = promoDetails;
  
  const mailOptions = {
    from: process.env.FROM_EMAIL || 'noreply@yourapp.com',
    to: email,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF6B35;">🎁 ${title}</h2>
        <p>${message}</p>
        
        ${couponCode ? `
        <div style="background-color: #FF6B35; color: white; padding: 30px; margin: 30px 0; border-radius: 8px; text-align: center;">
          <p style="margin: 0; font-size: 14px;">Use code:</p>
          <h1 style="margin: 10px 0; font-size: 36px; letter-spacing: 3px;">${couponCode}</h1>
          <p style="margin: 0; font-size: 18px;">Save ${discountValue}%</p>
        </div>
        ` : ''}
        
        ${validUntil ? `<p><strong>Valid until:</strong> ${new Date(validUntil).toLocaleDateString()}</p>` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #FF6B35; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Shop Now</a>
        </div>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Promotional email sent to ${email}`);
  } catch (error) {
    console.error('❌ Failed to send promotional email:', error);
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendOTPSMS,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
  sendRiderAssignmentEmail,
  sendPromotionalEmail
};
