import { Router } from 'express';
import Commission from '../models/Commission.js';
import Booking from '../models/Booking.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { formatCommission } from '../utils/formatters.js';

const router = Router();

router.get('/', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'consultancy') {
      if (!req.shop) return res.status(403).json({ error: 'Shop profile not found' });
      filter = { shop_id: req.shop._id };
    }

    const commissions = await Commission.find(filter).sort({ created_at: -1 });
    res.json({ commissions: commissions.map(formatCommission) });
  } catch (err) {
    console.error('List commissions error:', err);
    res.status(500).json({ error: 'Failed to load commissions' });
  }
});

router.get('/:id', authenticate, requireRole('admin', 'consultancy'), async (req, res) => {
  try {
    const commission = await Commission.findById(req.params.id);
    if (!commission) return res.status(404).json({ error: 'Commission not found' });

    if (req.user.role === 'consultancy') {
      if (!req.shop || commission.shop_id.toString() !== req.shop._id.toString()) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    res.json({ commission: formatCommission(commission) });
  } catch (err) {
    console.error('Get commission error:', err);
    res.status(500).json({ error: 'Failed to load commission' });
  }
});

export default router;
