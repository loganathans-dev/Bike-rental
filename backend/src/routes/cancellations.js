import { Router } from 'express';
import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import Payment from '../models/Payment.js';
import Refund from '../models/Refund.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { formatRefund } from '../utils/formatters.js';
import { calculateRefundAmount } from '../services/cancellation.js';
import { writeAudit } from '../utils/audit.js';
import { createRazorpayRefund } from '../services/razorpay.js';

const router = Router();

router.post(
  '/cancel-booking',
  authenticate,
  requireRole('customer', 'admin', 'consultancy'),
  validateBody({
    bookingId: { required: true, type: 'string' },
    cancellationReason: { required: true, type: 'string' },
    refundMethod: { required: true, type: 'string', enum: ['bank', 'upi'] },
  }),
  async (req, res) => {
    try {
      const { bookingId, cancellationReason, refundMethod, refundDetails } = req.body;
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      if (req.user.role === 'customer' && booking.customer_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      
      if (req.user.role === 'consultancy') {
        if (!req.shop || booking.shop_id.toString() !== req.shop._id.toString()) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      if (booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking is already cancelled' });
      }
      if (booking.status === 'completed') {
        return res.status(400).json({ error: 'Completed bookings cannot be cancelled' });
      }

      if (refundMethod === 'bank') {
        const { accountHolderName, accountNumber, ifscCode, bankName } = refundDetails || {};
        if (!accountHolderName || !accountNumber || !ifscCode || !bankName) {
          return res.status(400).json({ error: 'All bank refund details are required' });
        }
      } else if (refundMethod === 'upi') {
        if (!refundDetails?.upiId) {
          return res.status(400).json({ error: 'UPI ID is required for UPI refunds' });
        }
      }

      const payment = await Payment.findOne({
        booking_id: booking._id,
        payment_status: 'success',
      });
      const paidAmount = payment?.amount ?? booking.total_price;
      const { refundAmount, refundPercentage, reason } = calculateRefundAmount(booking, paidAmount);

      booking.status = 'cancelled';
      await booking.save();
      await Bike.findByIdAndUpdate(booking.bike_id, { availability_status: true });

      const refund = await Refund.create({
        booking_id: booking._id,
        customer_id: booking.customer_id,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        refund_status: refundAmount > 0 ? 'pending' : 'failed',
        customer_reason: cancellationReason,
        refund_method: refundMethod,
        refund_details: refundDetails || {},
        reason,
        // `processed_at` will be set when admin accepts the refund
      });

      await writeAudit({
        action: 'booking_cancelled',
        entityType: 'booking',
        entityId: booking._id,
        user: req.user,
        details: { refundAmount, refundPercentage, reason, cancellationReason, refundMethod },
      });

      res.json({
        message: 'Booking cancelled',
        refund: formatRefund(refund),
        rulesApplied: {
          within1Hour: refundPercentage === 100,
          after1Hour: refundPercentage === 95,
          bikePickedUp: refundPercentage === 0 && reason === 'bike_picked_up',
        },
      });
    } catch (err) {
      console.error('Cancel booking error:', err);
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  }
);

router.get('/refunds', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      filter.customer_id = req.user.id;
    } else if (req.user.role === 'consultancy' && req.shop) {
      // Find all bookings for this shop to filter refunds
      const shopBookings = await Booking.find({ shop_id: req.shop._id }).select('_id');
      const bookingIds = shopBookings.map(b => b._id);
      filter.booking_id = { $in: bookingIds };
    }

    const refunds = await Refund.find(filter).sort({ created_at: -1 });
    
    // Enrich with customer and booking details if needed
    // Assuming formatRefund handles it, or we may need to populate
    const populatedRefunds = await Promise.all(refunds.map(async (r) => {
      const booking = await Booking.findById(r.booking_id);
      return {
        ...formatRefund(r),
        bookingTotal: booking ? booking.total_price : 0,
        customerName: booking ? booking.customer_name : 'Customer',
        customerEmail: booking ? booking.customer_email : '',
      };
    }));

    res.json({ refunds: populatedRefunds });
  } catch (err) {
    console.error('List refunds error:', err);
    res.status(500).json({ error: 'Failed to load refunds' });
  }
});

router.get('/refunds/:id', authenticate, async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    if (req.user.role === 'customer' && refund.customer_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json({ refund: formatRefund(refund) });
  } catch (err) {
    console.error('Get refund error:', err);
    res.status(500).json({ error: 'Failed to load refund' });
  }
});

// Admin: accept or deny a refund (calculate 5% commission by default)
router.post('/refunds/:id/decision', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'deny'
    const refund = await Refund.findById(req.params.id);
    if (!refund) return res.status(404).json({ error: 'Refund not found' });

    if (action === 'accept') {
      const commissionPct = Number(process.env.REFUND_COMMISSION_PERCENTAGE ?? 5);
      // Use the original booking total to compute commission so commission is always
      // `commissionPct` percent of the booking total, and the refund_amount is
      // the (booking total - commission) already returned to the customer.
      const booking = await Booking.findById(refund.booking_id);
      const baseAmount = booking ? (booking.total_price ?? booking.totalPrice) : refund.refund_amount;
      const adminCommission = Math.round((baseAmount * commissionPct) / 100);
      const customerPayout = refund.refund_amount; // refund_amount is already net amount to customer

      // Handle Razorpay Refund
      const payment = await Payment.findOne({ booking_id: refund.booking_id, payment_status: 'success' });
      if (payment && payment.payment_method === 'razorpay' && payment.transaction_id) {
        try {
          await createRazorpayRefund({
            paymentId: payment.transaction_id,
            amountInr: customerPayout,
          });
        } catch (razorpayErr) {
          return res.status(400).json({ error: `Razorpay Refund Failed: ${razorpayErr.message}` });
        }
      }

      refund.refund_status = 'processed';
      refund.admin_commission = adminCommission;
      refund.customer_payout = customerPayout;
      refund.processed_at = new Date();
      await refund.save();

      return res.json({ refund: formatRefund(refund) });
    }

    if (action === 'deny') {
      refund.refund_status = 'failed';
      await refund.save();
      return res.json({ refund: formatRefund(refund) });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('Refund decision error:', err);
    res.status(500).json({ error: 'Failed to process refund decision' });
  }
});

// Admin: accept all pending refunds (process with commission)
router.post('/refunds/accept-all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const commissionPct = Number(process.env.REFUND_COMMISSION_PERCENTAGE ?? 5);
    const pending = await Refund.find({ refund_status: { $in: ['pending'] } });
    const results = [];
    for (const r of pending) {
      const booking = await Booking.findById(r.booking_id);
      const baseAmount = booking ? (booking.total_price ?? booking.totalPrice) : r.refund_amount;
      const adminCommission = Math.round((baseAmount * commissionPct) / 100);
      const customerPayout = r.refund_amount;
      r.refund_status = 'processed';
      r.admin_commission = adminCommission;
      r.customer_payout = customerPayout;
      r.processed_at = new Date();
      await r.save();
      results.push(formatRefund(r));
    }

    res.json({ refunds: results });
  } catch (err) {
    console.error('Accept all refunds error:', err);
    res.status(500).json({ error: 'Failed to accept all refunds' });
  }
});

export default router;
