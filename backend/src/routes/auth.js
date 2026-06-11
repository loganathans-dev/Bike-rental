import { Router } from 'express';
import bcrypt from 'bcryptjs';
import Consultancy from '../models/Consultancy.js';
import Customer from '../models/Customer.js';
import Admin from '../models/Admin.js';
import { authenticate, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    if (role === 'consultancy') {
      const existing = await Consultancy.findOne({ email: email.toLowerCase() });
      if (existing) return res.status(409).json({ error: 'Email already registered' });

      const consultancy = await Consultancy.create({
        email: email.toLowerCase(),
        password_hash,
        name: name || 'Partner',
      });

      console.log(`[MongoDB] Consultancy registered: ${consultancy.email} → consultancies collection`);

      const token = signToken({ id: consultancy._id.toString(), role: 'consultancy' });
      return res.status(201).json({
        token,
        user: {
          id: consultancy._id.toString(),
          email: consultancy.email,
          name: consultancy.name,
          role: 'consultancy',
        },
      });
    }

    const existing = await Customer.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const customer = await Customer.create({
      full_name: name || 'Customer',
      email: email.toLowerCase(),
      phone: phone || '',
      password_hash,
    });

    return res.status(201).json({
      message: 'Registration successful',
      user: {
        id: customer._id.toString(),
        email: customer.email,
        name: customer.full_name,
        role: 'customer',
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase();

    if (role === 'admin') {
      const admin = await Admin.findOne({ email: normalizedEmail });
      if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = signToken({ id: admin._id.toString(), role: 'admin' });
      return res.json({
        token,
        user: { id: admin._id.toString(), email: admin.email, name: admin.name, role: 'admin' },
      });
    }

    if (role === 'consultancy') {
      const consultancy = await Consultancy.findOne({ email: normalizedEmail });
      if (!consultancy || !(await bcrypt.compare(password, consultancy.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = signToken({ id: consultancy._id.toString(), role: 'consultancy' });
      return res.json({
        token,
        user: {
          id: consultancy._id.toString(),
          email: consultancy.email,
          name: consultancy.name,
          role: 'consultancy',
        },
      });
    }

    const customer = await Customer.findOne({ email: normalizedEmail });
    if (!customer || !(await bcrypt.compare(password, customer.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ id: customer._id.toString(), role: 'customer' });
    return res.json({
      token,
      user: {
        id: customer._id.toString(),
        email: customer.email,
        name: customer.full_name,
        role: 'customer',
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
