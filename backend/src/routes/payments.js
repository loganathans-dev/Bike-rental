import { Router } from 'express';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import Shop from '../models/Shop.js';
import Customer from '../models/Customer.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { formatPayment } from '../utils/formatters.js';
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
  getPublicKeyId,
} from '../services/razorpay.js';
import { recordCommission } from '../services/commission.js';
import Delivery from '../models/Delivery.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

async function getBookingForCustomer(bookingId, customerId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return { error: 'Booking not found', status: 404 };
  if (booking.customer_id.toString() !== customerId) {
    return { error: 'Forbidden', status: 403 };
  }
  const existing = await Payment.findOne({
    booking_id: booking._id,
    payment_status: 'success',
  });
  if (existing) {
    return { error: 'Booking already paid', status: 409 };
  }
  return { booking };
}

async function finalizePayment({ booking, shop, customer, amount, transactionId, method }) {
  const payment = await Payment.create({
    booking_id: booking._id,
    customer_id: booking.customer_id,
    consultancy_id: shop?.consultancy_id,
    amount,
    payment_method: method,
    payment_status: 'success',
    transaction_id: transactionId,
    paid_at: new Date(),
  });

  booking.status = 'booked';
  await booking.save();
  await Bike.findByIdAndUpdate(booking.bike_id, { availability_status: false });

  await recordCommission({ booking, payment });

  if (booking.is_delivery_requested && booking.delivery_address) {
    const existingDelivery = await Delivery.findOne({ booking_id: booking._id });
    if (!existingDelivery) {
      await Delivery.create({
        booking_id: booking._id,
        delivery_address: booking.delivery_address,
        delivery_charge: booking.delivery_charge || 0,
        assigned_staff: booking.delivery_staff_id || null,
        delivery_status: booking.delivery_staff_id ? 'assigned' : 'pending',
      });
    }
  }

  return payment;
}

function bookingPayableAmount(booking) {
  return booking.total_price + (booking.delivery_charge || 0);
}

router.get('/', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'consultancy') {
      if (!req.shop) return res.status(403).json({ error: 'Shop profile not found' });
      filter.consultancy_id = req.shop.consultancy_id;
    }

    const payments = await Payment.find(filter).sort({ paid_at: -1 });
    const customerIds = payments.map((p) => p.customer_id);
    const customers = await Customer.find({ _id: { $in: customerIds } });
    const customerMap = Object.fromEntries(customers.map((c) => [c._id.toString(), c]));

    const bookingIds = payments.map((p) => p.booking_id).filter(Boolean);
    const bookings = await Booking.find({ _id: { $in: bookingIds } });
    const shopIds = bookings.map((b) => b.shop_id).filter(Boolean);
    const shops = await Shop.find({ _id: { $in: shopIds } });
    
    const shopMap = Object.fromEntries(shops.map((s) => [s._id.toString(), s]));
    const bookingMap = Object.fromEntries(bookings.map((b) => [b._id.toString(), b]));

    res.json({
      payments: payments.map((p) => {
        const booking = bookingMap[p.booking_id?.toString()];
        const shop = booking ? shopMap[booking.shop_id?.toString()] : null;
        return formatPayment(p, customerMap[p.customer_id?.toString()], shop?.shop_name);
      }),
    });
  } catch (err) {
    console.error('List payments error:', err);
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

/** Create a Razorpay order for a booking (amount in INR). */
router.post('/razorpay/order', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const { bookingId } = req.body;
    const result = await getBookingForCustomer(bookingId, req.user.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const { booking } = result;
    const shop = await Shop.findById(booking.shop_id);
    const amount = bookingPayableAmount(booking);

    const order = await createRazorpayOrder({
      amountInr: amount,
      receipt: `booking_${booking._id.toString().slice(-12)}`,
      notes: { bookingId: booking._id.toString() },
    });

    res.json({
      keyId: getPublicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId: booking._id.toString(),
      customer: {
        name: req.user.name,
        email: req.user.email,
      },
    });
  } catch (err) {
    console.error('Razorpay order error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

/** Verify Razorpay payment signature and record payment. */
router.post('/razorpay/verify', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing Razorpay payment details' });
    }

    const valid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    const result = await getBookingForCustomer(bookingId, req.user.id);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    const { booking } = result;
    const shop = await Shop.findById(booking.shop_id);
    const customer = await Customer.findById(booking.customer_id);

    const payment = await finalizePayment({
      booking,
      shop,
      customer,
      amount: bookingPayableAmount(booking),
      transactionId: razorpay_payment_id,
      method: 'razorpay',
    });

    await writeAudit({
      action: 'payment_success',
      entityType: 'payment',
      entityId: payment._id,
      user: req.user,
      details: { bookingId, amount: payment.amount },
    });

    res.status(201).json({
      payment: formatPayment(payment, customer),
    });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ error: err.message || 'Payment verification failed' });
  }
});

export default router;
