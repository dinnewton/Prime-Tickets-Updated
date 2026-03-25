const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db/store');
const { stkPush, stkQuery } = require('../services/mpesa');
const { authMiddleware } = require('../middleware/auth');

/**
 * POST /api/payments/mpesa/stk-push
 * Initiates an M-Pesa STK Push for the provided cart items
 */
router.post('/mpesa/stk-push', async (req, res) => {
  const { phone, amount, cart, customerName, customerEmail } = req.body;

  if (!phone || !amount || !cart?.length) {
    return res.status(400).json({ message: 'phone, amount and cart are required' });
  }

  // Build a short order reference
  const orderRef = `PT${Date.now().toString().slice(-8)}`;
  const description = `PrimeTickets`;

  try {
    const mpesaRes = await stkPush(phone, amount, orderRef, description);

    if (mpesaRes.ResponseCode !== '0') {
      return res.status(502).json({
        message: mpesaRes.ResponseDescription || 'M-Pesa request failed',
      });
    }

    // Persist payment record
    db.savePayment(mpesaRes.CheckoutRequestID, {
      checkoutRequestId: mpesaRes.CheckoutRequestID,
      merchantRequestId: mpesaRes.MerchantRequestID,
      orderRef,
      phone,
      amount,
      cart,
      customerName,
      customerEmail,
      status: 'pending', // pending | success | failed | cancelled | timeout
      mpesaCode: null,
    });

    res.json({
      checkoutRequestId: mpesaRes.CheckoutRequestID,
      merchantRequestId: mpesaRes.MerchantRequestID,
      orderRef,
      message: 'STK push sent. Awaiting customer confirmation.',
    });
  } catch (err) {
    console.error('STK Push error:', err?.response?.data || err.message);
    res.status(502).json({
      message: err?.response?.data?.errorMessage || 'Could not initiate M-Pesa payment',
    });
  }
});

/**
 * POST /api/payments/mpesa/callback
 * Safaricom calls this URL after customer approves / cancels / times out
 */
router.post('/mpesa/callback', (req, res) => {
  // Always respond 200 to Safaricom immediately
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  try {
    const callback = req.body?.Body?.stkCallback;
    if (!callback) return;

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
    console.log(`M-Pesa Callback — CheckoutRequestID: ${CheckoutRequestID}, ResultCode: ${ResultCode}`);

    const payment = db.getPayment(CheckoutRequestID);
    if (!payment) return;

    if (ResultCode === 0) {
      // Payment successful — extract metadata
      const meta = {};
      CallbackMetadata?.Item?.forEach((item) => {
        meta[item.Name] = item.Value;
      });

      db.updatePayment(CheckoutRequestID, {
        status: 'success',
        mpesaCode: meta.MpesaReceiptNumber,
        transactionDate: meta.TransactionDate,
        paidAmount: meta.Amount,
        phoneUsed: meta.PhoneNumber,
      });

      // Create booking records
      payment.cart.forEach((item) => {
        db.createBooking({
          userId: payment.userId || 'guest',
          eventId: item.eventId,
          eventTitle: item.eventTitle,
          ticketType: item.ticketType,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
          mpesaCode: meta.MpesaReceiptNumber,
          orderRef: payment.orderRef,
          customerName: payment.customerName,
          customerEmail: payment.customerEmail,
        });

        // Update event sold tickets count
        const event = db.getEventById(item.eventId);
        if (event) {
          db.updateEvent(item.eventId, { soldTickets: event.soldTickets + item.quantity });
        }
      });

      // Update vendor revenue
      payment.cart.forEach((item) => {
        const event = db.getEventById(item.eventId);
        if (event) {
          const vendor = db.getVendorById(event.vendorId);
          if (vendor) {
            db.updateVendor(vendor.id, {
              totalRevenue: vendor.totalRevenue + item.price * item.quantity,
            });
          }
        }
      });
    } else {
      const statusMap = {
        1032: 'cancelled',
        1037: 'timeout',
      };
      db.updatePayment(CheckoutRequestID, {
        status: statusMap[ResultCode] || 'failed',
        failureReason: ResultDesc,
      });
    }
  } catch (err) {
    console.error('Callback processing error:', err.message);
  }
});

/**
 * GET /api/payments/mpesa/status/:checkoutRequestId
 * Frontend polls this to check if payment was confirmed
 */
router.get('/mpesa/status/:checkoutRequestId', async (req, res) => {
  const payment = db.getPayment(req.params.checkoutRequestId);

  if (!payment) {
    // Try querying M-Pesa directly if no local record
    try {
      const result = await stkQuery(req.params.checkoutRequestId);
      return res.json({
        status: result.ResultCode === '0' ? 'success' : 'pending',
        resultCode: result.ResultCode,
        resultDesc: result.ResultDesc,
      });
    } catch {
      return res.status(404).json({ message: 'Payment not found' });
    }
  }

  // If still pending after 2 minutes, query M-Pesa directly
  if (payment.status === 'pending') {
    const age = Date.now() - new Date(payment.createdAt).getTime();
    if (age > 120000) {
      try {
        const result = await stkQuery(req.params.checkoutRequestId);
        if (result.ResultCode === '0') {
          db.updatePayment(req.params.checkoutRequestId, { status: 'success' });
          payment.status = 'success';
        } else if (result.ResultCode !== '0') {
          db.updatePayment(req.params.checkoutRequestId, { status: 'failed' });
          payment.status = 'failed';
        }
      } catch {
        // Keep as pending if query fails
      }
    }
  }

  res.json({
    status: payment.status,
    mpesaCode: payment.mpesaCode,
    orderRef: payment.orderRef,
    amount: payment.amount,
  });
});

/**
 * GET /api/payments — admin: all payments
 */
const { requireRole } = require('../middleware/auth');
router.get('/', authMiddleware, requireRole('admin'), (req, res) => {
  const all = db.getAllPayments();
  res.json(all);
});

/**
 * GET /api/payments/bookings — admin: all bookings
 */
router.get('/bookings', authMiddleware, requireRole('admin'), (req, res) => {
  res.json(db.getBookings());
});

module.exports = router;
