import jwt from 'jsonwebtoken';
import Consultancy from '../models/Consultancy.js';
import Customer from '../models/Customer.js';
import Admin from '../models/Admin.js';
import Shop from '../models/Shop.js';

function getSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}

export function signToken(payload) {
  return jwt.sign(payload, getSecret(), { expiresIn: '7d' });
}

export function verifyToken(token) {
  return jwt.verify(token, getSecret());
}

export async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(header.slice(7));
    let user = null;

    if (decoded.role === 'customer') {
      user = await Customer.findById(decoded.id);
    } else if (decoded.role === 'consultancy') {
      user = await Consultancy.findById(decoded.id);
    } else if (decoded.role === 'admin') {
      user = await Admin.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.full_name || user.name || user.email,
      role: decoded.role,
    };

    if (decoded.role === 'consultancy') {
      req.shop = await Shop.findOne({ consultancy_id: user._id });
    }

    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}
