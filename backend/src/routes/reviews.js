import { Router } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Customer from '../models/Customer.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { formatReview } from '../utils/formatters.js';
import { refreshBikeRating } from '../services/ratings.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

router.post(
  '/',
  authenticate,
  requireRole('customer'),
  validateBody({
    bookingId: { required: true, type: 'string' },
    rating: { required: true, type: 'number', min: 1, max: 5 },
  }),
  async (req, res) => {
    try {
      const { bookingId, rating, comment } = req.body;
      const booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ error: 'Booking not found' });
      if (booking.customer_id.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Only completed bookings can be reviewed' });
      }

      const duplicate = await Review.findOne({
        customer_id: req.user.id,
        booking_id: booking._id,
      });
      if (duplicate) return res.status(409).json({ error: 'You already reviewed this booking' });

      const review = await Review.create({
        customer_id: req.user.id,
        booking_id: booking._id,
        bike_id: booking.bike_id,
        rating: Number(rating),
        comment: comment || '',
      });

      const ratingStats = await refreshBikeRating(booking.bike_id);
      await writeAudit({
        action: 'review_created',
        entityType: 'review',
        entityId: review._id,
        user: req.user,
        details: { bikeId: booking.bike_id.toString(), rating },
      });

      res.status(201).json({
        review: formatReview(review, { full_name: req.user.name, email: req.user.email }),
        averageRating: ratingStats.averageRating,
      });
    } catch (err) {
      console.error('Create review error:', err);
      res.status(500).json({ error: 'Failed to create review' });
    }
  }
);

router.get('/', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'customer') {
      filter.customer_id = req.user.id;
    } else if (req.user.role === 'consultancy' && req.shop) {
      const shopBookings = await Booking.find({ shop_id: req.shop._id }).select('bike_id');
      const bikeIds = shopBookings.map(b => b.bike_id);
      filter.bike_id = { $in: bikeIds };
    }

    const reviews = await Review.find(filter).sort({ created_at: -1 }).limit(100);
    const customerIds = reviews.map((r) => r.customer_id);
    const customers = await Customer.find({ _id: { $in: customerIds } });
    const customerMap = Object.fromEntries(customers.map((c) => [c._id.toString(), c]));

    res.json({
      reviews: reviews.map((r) => formatReview(r, customerMap[r.customer_id.toString()])),
    });
  } catch (err) {
    console.error('List reviews error:', err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

router.get('/bike/:bikeId', async (req, res) => {
  try {
    const reviews = await Review.find({ bike_id: req.params.bikeId }).sort({ created_at: -1 });
    const customerIds = reviews.map((r) => r.customer_id);
    const customers = await Customer.find({ _id: { $in: customerIds } });
    const customerMap = Object.fromEntries(customers.map((c) => [c._id.toString(), c]));

    const bikeObjectId = new mongoose.Types.ObjectId(req.params.bikeId);
    const agg = await Review.aggregate([
      { $match: { bike_id: bikeObjectId } },
      { $group: { _id: '$bike_id', averageRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    res.json({
      bikeId: req.params.bikeId,
      averageRating: agg[0]?.averageRating ?? null,
      reviewCount: agg[0]?.count ?? 0,
      reviews: reviews.map((r) => formatReview(r, customerMap[r.customer_id.toString()])),
    });
  } catch (err) {
    console.error('Bike reviews error:', err);
    res.status(500).json({ error: 'Failed to load bike reviews' });
  }
});

router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await refreshBikeRating(review.bike_id);
    await writeAudit({
      action: 'review_deleted',
      entityType: 'review',
      entityId: req.params.id,
      user: req.user,
    });
    res.json({ success: true, message: 'Review deleted' });
  } catch (err) {
    console.error('Delete review error:', err);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
