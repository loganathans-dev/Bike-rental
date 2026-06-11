import { Router } from 'express';
import Staff from '../models/Staff.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { formatStaff } from '../utils/formatters.js';
import { writeAudit } from '../utils/audit.js';

const router = Router();

router.get('/', authenticate, requireRole('consultancy', 'admin'), async (req, res) => {
  try {
    let staffList;
    if (req.user.role === 'admin') {
      staffList = await Staff.find().sort({ created_at: -1 });
    } else {
      if (!req.shop) {
        return res.status(403).json({ error: 'Shop profile not found' });
      }
      staffList = await Staff.find({ shop_id: req.shop._id }).sort({ created_at: -1 });
    }
    res.json({ staff: staffList.map(formatStaff) });
  } catch (err) {
    console.error('List staff error:', err);
    res.status(500).json({ error: 'Failed to load staff' });
  }
});

// Add new staff
router.post('/', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    if (!req.shop) {
      return res.status(403).json({ error: 'Shop profile not found' });
    }
    const { name, role, phone, email, status } = req.body;
    
    if (!name || !role || !phone) {
      return res.status(400).json({ error: 'Name, role, and phone are required' });
    }

    const newStaff = await Staff.create({
      shop_id: req.shop._id,
      name,
      role,
      phone,
      email,
      status: status || 'Active'
    });

    res.status(201).json({ staff: newStaff });
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// Update staff
router.put('/:id', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    if (!req.shop) {
      return res.status(403).json({ error: 'Shop profile not found' });
    }

    const staff = await Staff.findOne({ _id: req.params.id, shop_id: req.shop._id });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const { name, role, phone, email, status } = req.body;
    
    if (name) staff.name = name;
    if (role) staff.role = role;
    if (phone) staff.phone = phone;
    if (email !== undefined) staff.email = email;
    if (status) staff.status = status;

    await staff.save();
    res.json({ staff: formatStaff(staff) });
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// Delete staff
router.delete('/:id', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    if (!req.shop) {
      return res.status(403).json({ error: 'Shop profile not found' });
    }

    const staff = await Staff.findOneAndDelete({ _id: req.params.id, shop_id: req.shop._id });
    if (!staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    res.json({ success: true, message: 'Staff deleted successfully' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

export default router;
