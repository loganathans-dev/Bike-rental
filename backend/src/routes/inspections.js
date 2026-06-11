import { Router } from 'express';
import Inspection from '../models/Inspection.js';
import Booking from '../models/Booking.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { formatInspection } from '../utils/formatters.js';
import { validatePhotos } from '../utils/upload.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

async function getBookingAccess(req, bookingId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) return { error: 'Booking not found', status: 404 };

  if (req.user.role === 'admin') return { booking };
  if (req.user.role === 'consultancy' && req.shop && booking.shop_id.toString() === req.shop._id.toString()) {
    return { booking };
  }
  if (req.user.role === 'customer' && booking.customer_id.toString() === req.user.id) {
    return { booking };
  }
  return { error: 'Forbidden', status: 403 };
}

router.post(
  '/before',
  authenticate,
  requireRole('consultancy', 'admin'),
  validateBody({ bookingId: { required: true, type: 'string' } }),
  async (req, res) => {
    try {
      const { bookingId, beforePhotos, damageNotes } = req.body;
      const access = await getBookingAccess(req, bookingId);
      if (access.error) return res.status(access.status).json({ error: access.error });

      const photos = validatePhotos(beforePhotos, 'before');
      let inspection = await Inspection.findOne({ booking_id: bookingId });
      if (!inspection) {
        inspection = await Inspection.create({
          booking_id: bookingId,
          before_photos: photos,
          damage_notes: damageNotes || '',
          status: 'before_complete',
        });
      } else {
        inspection.before_photos = photos;
        inspection.damage_notes = damageNotes || inspection.damage_notes;
        inspection.status = 'before_complete';
        await inspection.save();
      }

      await writeAudit({
        action: 'inspection_before_uploaded',
        entityType: 'inspection',
        entityId: inspection._id,
        user: req.user,
        details: { bookingId, photoCount: photos.length },
      });

      res.status(201).json({ inspection: formatInspection(inspection) });
    } catch (err) {
      console.error('Before inspection error:', err);
      res.status(400).json({ error: err.message || 'Failed to save before inspection' });
    }
  }
);

router.post(
  '/after',
  authenticate,
  requireRole('consultancy', 'admin'),
  validateBody({ bookingId: { required: true, type: 'string' } }),
  async (req, res) => {
    try {
      const { bookingId, afterPhotos, damageNotes, damageAmount } = req.body;
      const access = await getBookingAccess(req, bookingId);
      if (access.error) return res.status(access.status).json({ error: access.error });

      const photos = validatePhotos(afterPhotos, 'after');
      let inspection = await Inspection.findOne({ booking_id: bookingId });
      if (!inspection) {
        return res.status(400).json({ error: 'Before inspection must be recorded first' });
      }

      inspection.after_photos = photos;
      if (damageNotes !== undefined) inspection.damage_notes = damageNotes;
      if (damageAmount !== undefined) inspection.damage_amount = Number(damageAmount) || 0;
      inspection.status = 'completed';
      await inspection.save();

      await writeAudit({
        action: 'inspection_after_uploaded',
        entityType: 'inspection',
        entityId: inspection._id,
        user: req.user,
        details: { bookingId, damageAmount: inspection.damage_amount },
      });

      res.json({
        inspection: formatInspection(inspection),
        damageReport: {
          damageNotes: inspection.damage_notes,
          damageAmount: inspection.damage_amount,
          status: inspection.status,
        },
      });
    } catch (err) {
      console.error('After inspection error:', err);
      res.status(400).json({ error: err.message || 'Failed to save after inspection' });
    }
  }
);

router.get('/:bookingId', authenticate, async (req, res) => {
  try {
    const access = await getBookingAccess(req, req.params.bookingId);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const inspection = await Inspection.findOne({ booking_id: req.params.bookingId });
    if (!inspection) return res.status(404).json({ error: 'Inspection not found' });

    res.json({ inspection: formatInspection(inspection) });
  } catch (err) {
    console.error('Get inspection error:', err);
    res.status(500).json({ error: 'Failed to load inspection' });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      const bookings = await Booking.find({ customer_id: req.user.id }).select('_id');
      filter.booking_id = { $in: bookings.map(b => b._id) };
    } else if (req.user.role === 'consultancy' && req.shop) {
      const shopBookings = await Booking.find({ shop_id: req.shop._id }).select('_id');
      filter.booking_id = { $in: shopBookings.map(b => b._id) };
    }

    const inspections = await Inspection.find(filter).sort({ created_at: -1 });

    const populatedInspections = await Promise.all(inspections.map(async (insp) => {
      const booking = await Booking.findById(insp.booking_id);
      return {
        ...formatInspection(insp),
        customerName: booking ? booking.customer_name : 'Customer',
        bookingStartDate: booking ? booking.start_datetime : null,
        bookingEndDate: booking ? booking.end_datetime : null,
      };
    }));

    res.json({ inspections: populatedInspections });
  } catch (err) {
    console.error('List inspections error:', err);
    res.status(500).json({ error: 'Failed to load inspections' });
  }
});

export default router;
