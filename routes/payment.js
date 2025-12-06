const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const chapaService = require('../utils/chapaService');

/**
 * Chapa webhook endpoint
 * Receives payment notifications from Chapa
 */
router.post('/webhook/chapa', async (req, res) => {
  try {
    const signature = req.headers['chapa-signature'];
    const payload = req.body;

    // Verify webhook signature
    if (!chapaService.verifyWebhookSignature(signature, payload)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { tx_ref, status, amount, currency } = payload;

    // Find order by transaction reference
    const order = await Order.findOne({ paymentReference: tx_ref });
    if (!order) {
      console.error('Order not found for tx_ref:', tx_ref);
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update payment status
    const paymentStatus = chapaService.normalizePaymentStatus(status);
    order.paymentStatus = paymentStatus;
    order.paymentTransactionId = tx_ref;
    order.paymentMetadata = {
      ...order.paymentMetadata,
      webhookReceivedAt: new Date(),
      chapaStatus: status,
      chapaAmount: amount,
      chapaCurrency: currency
    };

    if (paymentStatus === 'paid') {
      order.paidAmount = parseFloat(amount);
    }

    await order.save();

    console.log(`✅ Payment webhook processed for order ${order.orderId}: ${status}`);

    res.status(200).json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * Payment callback endpoint
 * User is redirected here after completing payment
 */
router.get('/callback', async (req, res) => {
  try {
    const { tx_ref, status } = req.query;

    if (!tx_ref) {
      return res.status(400).send('Missing transaction reference');
    }

    // Verify payment with Chapa
    const verification = await chapaService.verifyPayment(tx_ref);

    if (!verification.success) {
      return res.redirect(`/payment/failed?error=${encodeURIComponent(verification.error)}`);
    }

    // Find and update order
    const order = await Order.findOne({ paymentReference: tx_ref });
    if (order) {
      const paymentStatus = chapaService.normalizePaymentStatus(verification.status);
      order.paymentStatus = paymentStatus;
      order.paymentTransactionId = tx_ref;
      
      if (paymentStatus === 'paid') {
        order.paidAmount = verification.amount;
      }

      await order.save();
    }

    // Redirect based on payment status
    if (verification.status === 'success') {
      res.redirect(`/payment/success?orderId=${order?.orderId || ''}`);
    } else {
      res.redirect(`/payment/failed?status=${verification.status}`);
    }
  } catch (error) {
    console.error('Payment callback error:', error);
    res.redirect(`/payment/failed?error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Payment success page
 */
router.get('/success', (req, res) => {
  const { orderId } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Successful</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success-icon {
          font-size: 64px;
          color: #4CAF50;
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
        }
        .order-id {
          font-weight: bold;
          color: #4CAF50;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>Your payment has been processed successfully.</p>
        ${orderId ? `<p>Order ID: <span class="order-id">${orderId}</span></p>` : ''}
        <p>You can close this window and return to the app.</p>
      </div>
    </body>
    </html>
  `);
});

/**
 * Payment failed page
 */
router.get('/failed', (req, res) => {
  const { error, status } = req.query;
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Payment Failed</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          background: #f5f5f5;
        }
        .container {
          text-align: center;
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error-icon {
          font-size: 64px;
          color: #f44336;
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">✗</div>
        <h1>Payment Failed</h1>
        <p>Unfortunately, your payment could not be processed.</p>
        ${error ? `<p>Error: ${error}</p>` : ''}
        ${status ? `<p>Status: ${status}</p>` : ''}
        <p>Please try again or contact support.</p>
      </div>
    </body>
    </html>
  `);
});

module.exports = router;
