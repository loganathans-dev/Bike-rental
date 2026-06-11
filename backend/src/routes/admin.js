import { Router } from 'express';
import Customer from '../models/Customer.js';
import Consultancy from '../models/Consultancy.js';
import Shop from '../models/Shop.js';
import Bike from '../models/Bike.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import AuditLog from '../models/AuditLog.js';
import Commission from '../models/Commission.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { createRazorpayOrder, getPublicKeyId } from '../services/razorpay.js';


const router = Router();

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

router.get('/stats', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const [
      totalUsers,
      totalPartners,
      activeShops,
      pendingShops,
      pendingBikes,
      revenueAgg,
      customers,
      partners,
      shops,
      bookings,
      payments,
      bikes,
    ] = await Promise.all([
      Customer.countDocuments(),
      Consultancy.countDocuments(),
      Shop.countDocuments({ status: 'approved' }),
      Shop.countDocuments({ status: 'pending' }),
      Bike.countDocuments({ verification_status: 'pending' }),
      Payment.aggregate([
        { $match: { payment_status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Customer.find().sort({ created_at: -1 }).limit(5).select('full_name email created_at'),
      Consultancy.find().sort({ created_at: -1 }).limit(5).select('name email created_at'),
      Shop.find().sort({ created_at: -1 }).limit(5).select('shop_name owner_name city status created_at'),
      Booking.find().sort({ created_at: -1 }).limit(8).select('customer_name total_price status created_at'),
      Payment.find().sort({ paid_at: -1 }).limit(8).select('customer_id amount payment_method payment_status paid_at created_at'),
      Bike.find().sort({ created_at: -1 }).limit(5).select('shop_id bike_name verification_status created_at'),
    ]);

    const totalRevenue = revenueAgg[0]?.total ?? 0;

    const recentRegistrations = [
      ...customers.map((c) => ({
        id: c._id.toString(),
        type: 'customer',
        name: c.full_name,
        detail: c.email,
        status: 'registered',
        at: c.created_at,
      })),
      ...partners.map((p) => ({
        id: p._id.toString(),
        type: 'partner',
        name: p.name,
        detail: p.email,
        status: 'registered',
        at: p.created_at,
      })),
      ...shops.map((s) => ({
        id: s._id.toString(),
        type: 'shop',
        name: s.shop_name,
        detail: [s.owner_name, s.city].filter(Boolean).join(' · '),
        status: s.status,
        at: s.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 8)
      .map((row) => ({ ...row, atLabel: formatDate(row.at) }));

    const paymentCustomerIds = payments.map((p) => p.customer_id).filter(Boolean);
    const paymentCustomers = paymentCustomerIds.length
      ? await Customer.find({ _id: { $in: paymentCustomerIds } }).select('full_name email')
      : [];
    const customerNameById = Object.fromEntries(
      paymentCustomers.map((c) => [c._id.toString(), c.full_name || c.email])
    );

    const bikeShopIds = [...new Set(bikes.map((b) => b.shop_id?.toString()).filter(Boolean))];
    const bikeShops = bikeShopIds.length
      ? await Shop.find({ _id: { $in: bikeShopIds } }).select('shop_name')
      : [];
    const shopNameById = Object.fromEntries(bikeShops.map((s) => [s._id.toString(), s.shop_name]));

    const recentActivity = [
      ...bookings.map((b) => ({
        id: b._id.toString(),
        type: 'booking',
        title: b.customer_name || 'New booking',
        detail: `₹${b.total_price?.toLocaleString('en-IN') ?? 0}`,
        status: b.status,
        at: b.created_at,
      })),
      ...payments.map((p) => ({
        id: p._id.toString(),
        type: 'payment',
        title: customerNameById[p.customer_id?.toString()] || 'Payment received',
        detail: `₹${p.amount?.toLocaleString('en-IN') ?? 0} · ${p.payment_method || '—'}`,
        status: p.payment_status,
        at: p.paid_at || p.created_at,
      })),
      ...bikes.map((b) => ({
        id: b._id.toString(),
        type: 'bike',
        title: b.bike_name,
        detail: shopNameById[b.shop_id?.toString()] || 'New bike listing',
        status: b.verification_status,
        at: b.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 10)
      .map((row) => ({ ...row, atLabel: formatDate(row.at) }));

    res.json({
      stats: {
        totalUsers: totalUsers + totalPartners,
        activeShops,
        pendingVerifications: pendingShops + pendingBikes,
        totalRevenue,
        recentRegistrations,
        recentActivity,
      },
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/audit-logs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ created_at: -1 }).limit(100);
    res.json({
      logs: logs.map((log) => ({
        id: log._id.toString(),
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        userId: log.user_id,
        userRole: log.user_role,
        details: log.details,
        createdAt: log.created_at,
      })),
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
});

router.get('/shop-payments', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const shops = await Shop.find().sort({ created_at: -1 });
    const commissions = await Commission.find().populate('booking_id');
    
    // Group commissions by shop
    const shopPayments = shops.map((shop) => {
      const shopCommissions = commissions.filter(
        (c) => c.shop_id?.toString() === shop._id.toString()
      );
      
      const pendingCommissions = shopCommissions.filter((c) => c.status === 'pending');
      const paidCommissions = shopCommissions.filter((c) => c.status === 'paid');
      
      const totalPendingPayout = pendingCommissions.reduce((sum, c) => sum + c.shop_amount, 0);
      const totalPaidPayout = paidCommissions.reduce((sum, c) => sum + c.shop_amount, 0);

      return {
        id: shop._id.toString(),
        shopName: shop.shop_name,
        ownerName: shop.owner_name,
        city: shop.city,
        bank: shop.bank || {},
        totalPendingPayout,
        totalPaidPayout,
        commissions: shopCommissions.map((c) => ({
          id: c._id.toString(),
          bookingId: c.booking_id?._id?.toString() || c.booking_id?.toString(),
          paymentId: c.payment_id?.toString(),
          totalPayment: c.total_amount,
          adminCommission: c.admin_amount,
          payableToShop: c.shop_amount,
          status: c.status,
          paidAt: c.paid_at,
          createdAt: c.created_at,
        })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      };
    });

    res.json({ shopPayments });
  } catch (err) {
    console.error('Shop payments error:', err);
    res.status(500).json({ error: 'Failed to load shop payments' });
  }
});

router.post('/shop-payments/:shopId/pay', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    // Mark all pending commissions for this shop as paid
    const result = await Commission.updateMany(
      { shop_id: shopId, status: 'pending' },
      { $set: { status: 'paid', paid_at: new Date() } }
    );

    await AuditLog.create({
      action: 'shop_payout_processed',
      entity_type: 'shop',
      entity_id: shop._id,
      user_id: req.user.id,
      user_role: req.user.role,
      details: { shopName: shop.shop_name, modifiedCount: result.modifiedCount },
    });

    res.json({ message: 'Payout processed successfully', updatedCount: result.modifiedCount });
  } catch (err) {
    console.error('Process shop payment error:', err);
    res.status(500).json({ error: 'Failed to process shop payout' });
  }
});

router.post('/shop-payments/:shopId/razorpay-order', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { shopId } = req.params;
    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const commissions = await Commission.find({ shop_id: shopId, status: 'pending' });
    const amount = commissions.reduce((sum, c) => sum + c.shop_amount, 0);

    if (amount <= 0) {
      return res.status(400).json({ error: 'No pending amount to pay' });
    }

    const order = await createRazorpayOrder({
      amountInr: amount,
      receipt: `payout_${shopId.toString().slice(-10)}`,
      notes: { shopId: shopId.toString() },
    });

    res.json({
      keyId: getPublicKeyId(),
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (err) {
    console.error('Create payout order error:', err);
    res.status(500).json({ error: 'Failed to create payout order' });
  }
});

export default router;
