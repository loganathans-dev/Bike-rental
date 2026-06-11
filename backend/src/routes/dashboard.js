import { Router } from 'express';
import Payment from '../models/Payment.js';
import Booking from '../models/Booking.js';
import Bike from '../models/Bike.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

function shopMatch(req) {
  if (req.user.role === 'admin') return {};
  if (req.user.role === 'consultancy' && req.shop) {
    return { shop_id: req.shop._id };
  }
  return null;
}

function rangeStart(period) {
  const now = new Date();
  if (period === 'daily') {
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }
  if (period === 'weekly') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === 'monthly') {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return new Date(0);
}

async function buildSummary(req, period) {
  const shopFilter = shopMatch(req);
  if (shopFilter === null) return { error: 'Forbidden', status: 403 };

  const since = rangeStart(period);
  const bookingMatch = { created_at: { $gte: since }, ...shopFilter };
  const paymentBookingIds = shopFilter.shop_id
    ? (await Booking.find(shopFilter).select('_id')).map((b) => b._id)
    : null;

  const paymentMatch = {
    payment_status: 'success',
    paid_at: { $gte: since },
    ...(paymentBookingIds ? { booking_id: { $in: paymentBookingIds } } : {}),
  };

  const [revenueAgg, bookingAgg, bikeStats] = await Promise.all([
    Payment.aggregate([
      { $match: paymentMatch },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
    ]),
    Booking.aggregate([
      { $match: bookingMatch },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$total_price' },
        },
      },
    ]),
    Bike.aggregate([
      ...(shopFilter.shop_id ? [{ $match: { shop_id: shopFilter.shop_id } }] : []),
      {
        $group: {
          _id: '$verification_status',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const bookingSummary = {
    total: bookingAgg.reduce((n, row) => n + row.count, 0),
    byStatus: Object.fromEntries(bookingAgg.map((r) => [r._id, r.count])),
    totalBookingValue: bookingAgg.reduce((n, row) => n + (r.totalValue || 0), 0),
  };

  const bikeStatistics = {
    total: bikeStats.reduce((n, row) => n + row.count, 0),
    byVerification: Object.fromEntries(bikeStats.map((r) => [r._id, r.count])),
  };

  return {
    period,
    since,
    revenueSummary: {
      totalRevenue: revenueAgg[0]?.totalRevenue ?? 0,
      paymentCount: revenueAgg[0]?.paymentCount ?? 0,
    },
    bookingSummary,
    bikeStatistics,
  };
}

router.get('/daily', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    const data = await buildSummary(req, 'daily');
    if (data.error) return res.status(data.status).json({ error: data.error });
    res.json(data);
  } catch (err) {
    console.error('Dashboard daily error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/weekly', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    const data = await buildSummary(req, 'weekly');
    if (data.error) return res.status(data.status).json({ error: data.error });
    res.json(data);
  } catch (err) {
    console.error('Dashboard weekly error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/monthly', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    const data = await buildSummary(req, 'monthly');
    if (data.error) return res.status(data.status).json({ error: data.error });
    res.json(data);
  } catch (err) {
    console.error('Dashboard monthly error:', err);
    res.status(500).json({ error: 'Failed to load dashboard' });
  }
});

router.get('/top-bikes', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    const shopFilter = shopMatch(req);
    if (shopFilter === null) return res.status(403).json({ error: 'Forbidden' });

    const since = rangeStart('monthly');
    const matchStage = {
      created_at: { $gte: since },
      status: { $in: ['booked', 'ready', 'on_the_way', 'delivered', 'completed'] },
      ...shopFilter,
    };

    const topBikes = await Booking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$bike_id',
          bookings: { $sum: 1 },
          revenue: { $sum: '$total_price' },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'bikes',
          localField: '_id',
          foreignField: '_id',
          as: 'bike',
        },
      },
      { $unwind: { path: '$bike', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          bikeId: '$_id',
          bikeName: '$bike.bike_name',
          brand: '$bike.brand',
          bookings: 1,
          revenue: 1,
        },
      },
    ]);

    res.json({ period: 'monthly', topBikes });
  } catch (err) {
    console.error('Top bikes error:', err);
    res.status(500).json({ error: 'Failed to load top bikes' });
  }
});

export default router;
