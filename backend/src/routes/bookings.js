import { Router } from 'express';
import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import Shop from '../models/Shop.js';
import Customer from '../models/Customer.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import {
  formatBooking,
  parseDateTime,
  calculateTotalPrice,
} from '../utils/formatters.js';
import { writeAudit } from '../utils/audit.js';
import { calculateRefundAmount } from '../services/cancellation.js';
import Payment from '../models/Payment.js';
import Refund from '../models/Refund.js';

const router = Router();

async function enrichBookings(bookings) {
  const bikeIds = bookings.map((b) => b.bike_id);
  const shopIds = bookings.map((b) => b.shop_id);
  const [bikes, shops] = await Promise.all([
    Bike.find({ _id: { $in: bikeIds } }),
    Shop.find({ _id: { $in: shopIds } }),
  ]);
  const bikeMap = Object.fromEntries(bikes.map((b) => [b._id.toString(), b]));
  const shopMap = Object.fromEntries(shops.map((s) => [s._id.toString(), s]));

  return bookings.map((b) =>
    formatBooking(b, bikeMap[b.bike_id.toString()], shopMap[b.shop_id.toString()])
  );
}

router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};

    if (req.user.role === 'customer') {
      filter.customer_id = req.user.id;
    } else if (req.user.role === 'consultancy' && req.shop) {
      filter.shop_id = req.shop._id;
    } else if (req.user.role === 'admin') {
      filter = {};
    } else {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const bookings = await Booking.find(filter).sort({ created_at: -1 });
    res.json({ bookings: await enrichBookings(bookings) });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

router.post('/', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const {
      bikeId, startDate, startTime, endDate, endTime, pickupLocation,
      customerName, customerEmail, customerMobile, licence, address, aadhaar,
      isDeliveryRequested, deliveryAddress, rentalType,
      customerLat, customerLng
    } = req.body;

    if (!bikeId) {
      return res.status(400).json({ error: 'Bike ID is required' });
    }

    const bike = await Bike.findById(bikeId);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    if (!bike.availability_status) {
      return res.status(400).json({
        error: 'This bike is already booked or marked unavailable. Choose another bike.',
      });
    }

    const shop = await Shop.findById(bike.shop_id);
    if (!shop || shop.status !== 'approved' || bike.verification_status !== 'approved') {
      return res.status(400).json({
        error: 'This bike is not approved for booking yet. Ask the shop or admin to approve it.',
      });
    }

    const start = parseDateTime(startDate, startTime);
    const end = parseDateTime(endDate, endTime);
    if (!start || !end) {
      return res.status(400).json({
        error: 'Invalid booking dates. Enter valid start and end date/time.',
      });
    }
    if (end <= start) {
      return res.status(400).json({
        error: 'End date and time must be after start date and time.',
      });
    }

    const total_price = calculateTotalPrice(bike, start, end, rentalType);

    const deliveryRequested = Boolean(isDeliveryRequested);
    const booking = await Booking.create({
      customer_id: req.user.id,
      bike_id: bike._id,
      shop_id: shop._id,
      start_datetime: start,
      end_datetime: end,
      rental_type: rentalType || 'daily',
      total_price,
      status: 'booked',
      pickup_location: pickupLocation || '',
      customer_name: customerName || '',
      customer_email: customerEmail || '',
      customer_mobile: customerMobile || '',
      licence: licence || '',
      address: address || '',
      aadhaar: aadhaar || '',
      bike_images: bike.images || [],
      is_delivery_requested: deliveryRequested,
      delivery_address: deliveryRequested ? (deliveryAddress || '') : '',
      delivery_charge: deliveryRequested ? 100 : 0,
      customer_coordinates: {
        lat: customerLat !== undefined ? Number(customerLat) : null,
        lng: customerLng !== undefined ? Number(customerLng) : null,
      },
    });

    await writeAudit({
      action: 'booking_created',
      entityType: 'booking',
      entityId: booking._id,
      user: req.user,
      details: { bikeId: bike._id.toString(), deliveryRequested },
    });

    res.status(201).json({
      booking: {
        id: booking._id.toString(),
        totalAmount: booking.total_price,
        status: 'upcoming',
      },
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['booked', 'ready', 'on_the_way', 'delivered', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (req.user.role === 'customer') {
      if (booking.customer_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (status !== 'cancelled') {
        return res.status(403).json({ error: 'Customers can only cancel bookings' });
      }
      if (booking.status === 'completed' || booking.status === 'cancelled') {
        return res.status(400).json({ error: 'Booking cannot be cancelled at this stage' });
      }
    } else if (req.user.role === 'consultancy') {
      if (!req.shop || booking.shop_id.toString() !== req.shop._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    booking.status = status;
    await booking.save();

    if (status === 'completed' || status === 'cancelled') {
      await Bike.findByIdAndUpdate(booking.bike_id, { availability_status: true });
    }

    if (status === 'cancelled') {
      const payment = await Payment.findOne({
        booking_id: booking._id,
        payment_status: 'success',
      });
      const paidAmount = payment?.amount ?? booking.total_price;
      const { refundAmount, refundPercentage, reason } = calculateRefundAmount(booking, paidAmount);

      await Refund.create({
        booking_id: booking._id,
        customer_id: booking.customer_id,
        refund_amount: refundAmount,
        refund_percentage: refundPercentage,
        refund_status: refundAmount > 0 ? 'processed' : 'processed',
        reason,
        processed_at: new Date(),
      });

      await writeAudit({
        action: 'booking_cancelled',
        entityType: 'booking',
        entityId: booking._id,
        user: req.user,
        details: { refundAmount, refundPercentage, reason },
      });
    }

    const [bike, shop] = await Promise.all([
      Bike.findById(booking.bike_id),
      Shop.findById(booking.shop_id),
    ]);

    res.json({ booking: formatBooking(booking, bike, shop) });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

router.patch('/:id/assign-staff', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const { staffId } = req.body;
    
    if (!req.shop) {
      return res.status(403).json({ error: 'Shop profile not found' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.shop_id.toString() !== req.shop._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    booking.delivery_staff_id = staffId || null;
    await booking.save();

    res.json({ success: true, message: 'Staff assigned successfully' });
  } catch (err) {
    console.error('Assign staff error:', err);
    res.status(500).json({ error: 'Failed to assign staff' });
  }
});

router.patch('/:id/request-pickup', authenticate, requireRole('customer'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.customer_id.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    booking.pickup_requested = true;
    await booking.save();

    res.json({ success: true, message: 'Pickup requested successfully' });
  } catch (err) {
    console.error('Request pickup error:', err);
    res.status(500).json({ error: 'Failed to request pickup' });
  }
});

export default router;
