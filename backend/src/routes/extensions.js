import { Router } from 'express';
import Extension from '../models/Extension.js';
import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { formatExtension, calculateTotalPrice } from '../utils/formatters.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

async function hasOverlappingBooking(bikeId, start, end, excludeBookingId) {
  const overlap = await Booking.findOne({
    _id: { $ne: excludeBookingId },
    bike_id: bikeId,
    status: { $nin: ['cancelled', 'completed'] },
    start_datetime: { $lt: end },
    end_datetime: { $gt: start },
  });
  return Boolean(overlap);
}

router.post(
  '/',
  authenticate,
  requireRole('customer', 'consultancy', 'admin'),
  validateBody({
    bookingId: { required: true, type: 'string' },
    newEndTime: { required: true, type: 'string' },
  }),
  async (req, res) => {
    try {
      const { bookingId, newEndTime } = req.body;
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

      if (['cancelled', 'completed'].includes(booking.status)) {
        return res.status(400).json({ error: 'Cannot extend a closed booking' });
      }

      const newEnd = new Date(newEndTime);
      if (Number.isNaN(newEnd.getTime()) || newEnd <= booking.end_datetime) {
        return res.status(400).json({ error: 'newEndTime must be after current booking end time' });
      }

      const bike = await Bike.findById(booking.bike_id);
      if (!bike) return res.status(404).json({ error: 'Bike not found' });

      const overlap = await hasOverlappingBooking(
        booking.bike_id,
        booking.end_datetime,
        newEnd,
        booking._id
      );
      if (overlap) {
        return res.status(400).json({ error: 'Bike is not available for the extended period' });
      }

      const oldTotal = booking.total_price;
      const newTotal = calculateTotalPrice(bike, booking.start_datetime, newEnd);
      const extraAmount = Math.max(0, newTotal - oldTotal);

      const extension = await Extension.create({
        booking_id: booking._id,
        old_end_time: booking.end_datetime,
        new_end_time: newEnd,
        extra_amount: extraAmount,
        status: 'approved',
      });

      booking.end_datetime = newEnd;
      booking.total_price = newTotal;
      await booking.save();

      await writeAudit({
        action: 'booking_extended',
        entityType: 'extension',
        entityId: extension._id,
        user: req.user,
        details: { bookingId, extraAmount },
      });

      res.status(201).json({ extension: formatExtension(extension) });
    } catch (err) {
      console.error('Create extension error:', err);
      res.status(500).json({ error: 'Failed to create extension' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
  try {
    let bookingIds = null;
    if (req.user.role === 'customer') {
      const bookings = await Booking.find({ customer_id: req.user.id }).select('_id');
      bookingIds = bookings.map((b) => b._id);
    } else if (req.user.role === 'consultancy') {
      if (!req.shop) return res.status(403).json({ error: 'Shop profile not found' });
      const bookings = await Booking.find({ shop_id: req.shop._id }).select('_id');
      bookingIds = bookings.map((b) => b._id);
    }

    const filter = bookingIds ? { booking_id: { $in: bookingIds } } : {};
    const extensions = await Extension.find(filter).sort({ created_at: -1 });
    res.json({ extensions: extensions.map(formatExtension) });
  } catch (err) {
    console.error('List extensions error:', err);
    res.status(500).json({ error: 'Failed to load extensions' });
  }
});

router.put(
  '/:id',
  authenticate,
  requireRole('consultancy', 'admin'),
  validateBody({ status: { enum: ['pending', 'approved', 'rejected'] } }),
  async (req, res) => {
    try {
      const extension = await Extension.findById(req.params.id);
      if (!extension) return res.status(404).json({ error: 'Extension not found' });

      const booking = await Booking.findById(extension.booking_id);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      if (req.user.role === 'consultancy') {
        if (!req.shop || booking.shop_id.toString() !== req.shop._id.toString()) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      if (req.body.status) extension.status = req.body.status;
      await extension.save();

      res.json({ extension: formatExtension(extension) });
    } catch (err) {
      console.error('Update extension error:', err);
      res.status(500).json({ error: 'Failed to update extension' });
    }
  }
);

export default router;
