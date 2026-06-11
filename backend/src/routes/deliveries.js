import { Router } from 'express';
import Delivery from '../models/Delivery.js';
import Booking from '../models/Booking.js';
import Staff from '../models/Staff.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { formatDelivery } from '../utils/formatters.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

async function canAccessDelivery(req, delivery) {
  const booking = await Booking.findById(delivery.booking_id);
  if (!booking) return { ok: false, status: 404, error: 'Booking not found' };

  if (req.user.role === 'admin') return { ok: true, booking };
  if (req.user.role === 'customer' && booking.customer_id.toString() === req.user.id) {
    return { ok: true, booking };
  }
  if (req.user.role === 'consultancy' && req.shop && booking.shop_id.toString() === req.shop._id.toString()) {
    return { ok: true, booking };
  }
  return { ok: false, status: 403, error: 'Forbidden' };
}

router.post(
  '/',
  authenticate,
  requireRole('consultancy', 'admin'),
  validateBody({
    bookingId: { required: true, type: 'string' },
    deliveryAddress: { required: true, type: 'string' },
    deliveryCharge: { type: 'number' },
  }),
  async (req, res) => {
    try {
      const { bookingId, deliveryAddress, deliveryCharge, assignedStaff } = req.body;
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });

      if (req.user.role === 'consultancy') {
        if (!req.shop || booking.shop_id.toString() !== req.shop._id.toString()) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }

      const existing = await Delivery.findOne({ booking_id: booking._id });
      if (existing) return res.status(409).json({ error: 'Delivery already exists for this booking' });

      const delivery = await Delivery.create({
        booking_id: booking._id,
        delivery_address: deliveryAddress,
        delivery_charge: Number(deliveryCharge) || booking.delivery_charge || 0,
        assigned_staff: assignedStaff || booking.delivery_staff_id || null,
        delivery_status: assignedStaff ? 'assigned' : 'pending',
      });

      await writeAudit({
        action: 'delivery_created',
        entityType: 'delivery',
        entityId: delivery._id,
        user: req.user,
        details: { bookingId },
      });

      const staff = delivery.assigned_staff
        ? await Staff.findById(delivery.assigned_staff)
        : null;
      res.status(201).json({ delivery: formatDelivery(delivery, staff) });
    } catch (err) {
      console.error('Create delivery error:', err);
      res.status(500).json({ error: 'Failed to create delivery' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
  try {
    let bookingFilter = {};
    if (req.user.role === 'customer') {
      const bookings = await Booking.find({ customer_id: req.user.id }).select('_id');
      bookingFilter = { booking_id: { $in: bookings.map((b) => b._id) } };
    } else if (req.user.role === 'consultancy') {
      if (!req.shop) return res.status(403).json({ error: 'Shop profile not found' });
      const bookings = await Booking.find({ shop_id: req.shop._id }).select('_id');
      bookingFilter = { booking_id: { $in: bookings.map((b) => b._id) } };
    }

    const deliveries = await Delivery.find(bookingFilter).sort({ created_at: -1 });
    const staffIds = deliveries.map((d) => d.assigned_staff).filter(Boolean);
    const staffMap = Object.fromEntries(
      (await Staff.find({ _id: { $in: staffIds } })).map((s) => [s._id.toString(), s])
    );

    res.json({
      deliveries: deliveries.map((d) =>
        formatDelivery(d, staffMap[d.assigned_staff?.toString()])
      ),
    });
  } catch (err) {
    console.error('List deliveries error:', err);
    res.status(500).json({ error: 'Failed to load deliveries' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const access = await canAccessDelivery(req, delivery);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    const staff = delivery.assigned_staff
      ? await Staff.findById(delivery.assigned_staff)
      : null;
    res.json({ delivery: formatDelivery(delivery, staff) });
  } catch (err) {
    console.error('Get delivery error:', err);
    res.status(500).json({ error: 'Failed to load delivery' });
  }
});

router.put(
  '/:id',
  authenticate,
  requireRole('consultancy', 'admin'),
  validateBody({
    deliveryStatus: { enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'] },
  }),
  async (req, res) => {
    try {
      const delivery = await Delivery.findById(req.params.id);
      if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

      const access = await canAccessDelivery(req, delivery);
      if (!access.ok) return res.status(access.status).json({ error: access.error });

      const { deliveryAddress, deliveryCharge, deliveryStatus, assignedStaff } = req.body;
      if (deliveryAddress !== undefined) delivery.delivery_address = deliveryAddress;
      if (deliveryCharge !== undefined) delivery.delivery_charge = Number(deliveryCharge);
      if (deliveryStatus) delivery.delivery_status = deliveryStatus;
      if (assignedStaff !== undefined) {
        delivery.assigned_staff = assignedStaff || null;
        if (assignedStaff && delivery.delivery_status === 'pending') {
          delivery.delivery_status = 'assigned';
        }
      }

      await delivery.save();

      if (deliveryStatus === 'delivered' && access.booking) {
        access.booking.status = 'delivered';
        await access.booking.save();
      }

      await writeAudit({
        action: 'delivery_updated',
        entityType: 'delivery',
        entityId: delivery._id,
        user: req.user,
        details: { deliveryStatus: delivery.delivery_status },
      });

      const staff = delivery.assigned_staff
        ? await Staff.findById(delivery.assigned_staff)
        : null;
      res.json({ delivery: formatDelivery(delivery, staff) });
    } catch (err) {
      console.error('Update delivery error:', err);
      res.status(500).json({ error: 'Failed to update delivery' });
    }
  }
);

router.delete('/:id', authenticate, requireRole('consultancy', 'admin'), async (req, res) => {
  try {
    const delivery = await Delivery.findById(req.params.id);
    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const access = await canAccessDelivery(req, delivery);
    if (!access.ok) return res.status(access.status).json({ error: access.error });

    await delivery.deleteOne();
    await writeAudit({
      action: 'delivery_deleted',
      entityType: 'delivery',
      entityId: req.params.id,
      user: req.user,
    });
    res.json({ success: true, message: 'Delivery deleted' });
  } catch (err) {
    console.error('Delete delivery error:', err);
    res.status(500).json({ error: 'Failed to delete delivery' });
  }
});

export default router;
