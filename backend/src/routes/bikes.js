import { Router } from 'express';
import Bike from '../models/Bike.js';
import Shop from '../models/Shop.js';
import { authenticate, optionalAuth, requireRole } from '../middleware/auth.js';
import { formatBike } from '../utils/formatters.js';

const router = Router();

async function getShopMap(shopIds) {
  const shops = await Shop.find({ _id: { $in: shopIds } });
  return Object.fromEntries(shops.map((s) => [s._id.toString(), s]));
}

async function getPublicListMeta() {
  const approvedShops = await Shop.find({ status: 'approved' }).select('_id city');
  const approvedShopIds = approvedShops.map((s) => s._id);
  const cities = [...new Set(approvedShops.map((s) => s.city).filter(Boolean))].sort();
  const categories = await Bike.distinct('category', {
    verification_status: 'approved',
    shop_id: { $in: approvedShopIds },
  });

  return {
    locations: ['All Locations', ...cities],
    categories: ['All Categories', ...categories.filter(Boolean).sort()],
  };
}

function isPublicBikeVisible(bike, shop) {
  return bike.verification_status === 'approved' && shop?.status === 'approved';
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search, location, category, maxPrice, availableOnly } = req.query;
    const isPartner = req.user?.role === 'consultancy';
    const isAdmin = req.user?.role === 'admin';

    let filter = {};

    if (isPartner && req.shop) {
      filter.shop_id = req.shop._id;
    } else if (!isAdmin) {
      const approvedShops = await Shop.find({ status: 'approved' }).select('_id city');
      const approvedShopIds = approvedShops.map((s) => s._id);
      filter.shop_id = { $in: approvedShopIds };
      filter.verification_status = 'approved';
    }

    if (category && category !== 'All Categories') {
      filter.category = category;
    }
    if (availableOnly === 'true') {
      filter.availability_status = true;
    }
    if (maxPrice) {
      filter.price_per_day = { $lte: Number(maxPrice) };
    }
    if (search) {
      filter.$or = [
        { bike_name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
      ];
    }

    let bikes = await Bike.find(filter).sort({ created_at: -1 });

    const shopIds = [...new Set(bikes.map((b) => b.shop_id.toString()))];
    const shopMap = await getShopMap(shopIds);

    if (location && location !== 'All Locations') {
      bikes = bikes.filter((b) => {
        const shop = shopMap[b.shop_id.toString()];
        return shop?.city?.toLowerCase() === location.toLowerCase();
      });
    }

    const payload = { bikes: bikes.map((b) => formatBike(b, shopMap[b.shop_id.toString()])) };
    if (!isPartner && !isAdmin) {
      payload.meta = await getPublicListMeta();
    }

    res.json(payload);
  } catch (err) {
    console.error('List bikes error:', err);
    res.status(500).json({ error: 'Failed to load bikes' });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    const shop = await Shop.findById(bike.shop_id);
    const isPartner =
      req.user?.role === 'consultancy' &&
      req.shop &&
      bike.shop_id.toString() === req.shop._id.toString();
    const isAdmin = req.user?.role === 'admin';

    if (!isAdmin && !isPartner && !isPublicBikeVisible(bike, shop)) {
      return res.status(404).json({ error: 'Bike not found' });
    }

    res.json({ bike: formatBike(bike, shop) });
  } catch (err) {
    console.error('Get bike error:', err);
    res.status(500).json({ error: 'Failed to load bike' });
  }
});

router.post('/', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    if (!req.shop) {
      return res.status(400).json({ error: 'Register your shop before adding bikes' });
    }
    if (req.shop.status !== 'approved') {
      return res.status(403).json({ error: 'Shop must be approved before adding bikes' });
    }

    const {
      name, brand, vehicleNumber, category, fuelType, mileage,
      pricePerHour, pricePerDay, securityDeposit, description,
      chassisNumber, engineNumber, rcNumber, isAvailable,
      rcDocument, insurancePolicyNumber, insuranceExpiryDate, insuranceDocument, images,
    } = req.body;

    const bike = await Bike.create({
      shop_id: req.shop._id,
      bike_name: name,
      brand,
      vehicle_number: vehicleNumber,
      category,
      fuel_type: fuelType,
      mileage: String(mileage ?? ''),
      price_per_hour: Number(pricePerHour) || 0,
      price_per_day: Number(pricePerDay) || 0,
      security_deposit: Number(securityDeposit) || 0,
      description: description || '',
      chassis_number: chassisNumber || '',
      engine_number: engineNumber || '',
      rc_number: rcNumber || '',
      rc_book_upload: rcDocument || '',
      insurance_policy_number: insurancePolicyNumber || '',
      insurance_expiry_date: insuranceExpiryDate ? new Date(insuranceExpiryDate) : undefined,
      insurance_document_upload: insuranceDocument || '',
      images: Array.isArray(images) ? images : images ? [images] : [],
      availability_status: isAvailable !== false,
      verification_status: 'pending',
    });

    res.status(201).json({ bike: formatBike(bike, req.shop) });
  } catch (err) {
    console.error('Create bike error:', err);
    res.status(500).json({ error: 'Failed to create bike' });
  }
});

router.put('/:id', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    if (!req.shop || bike.shop_id.toString() !== req.shop._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const {
      name, brand, vehicleNumber, category, fuelType, mileage,
      pricePerHour, pricePerDay, securityDeposit, description, isAvailable,
      chassisNumber, engineNumber, rcNumber, rcDocument,
      insurancePolicyNumber, insuranceExpiryDate, insuranceDocument, images,
    } = req.body;

    if (name !== undefined) bike.bike_name = name;
    if (brand !== undefined) bike.brand = brand;
    if (vehicleNumber !== undefined) bike.vehicle_number = vehicleNumber;
    if (category !== undefined) bike.category = category;
    if (fuelType !== undefined) bike.fuel_type = fuelType;
    if (mileage !== undefined) bike.mileage = String(mileage);
    if (pricePerHour !== undefined) bike.price_per_hour = Number(pricePerHour);
    if (pricePerDay !== undefined) bike.price_per_day = Number(pricePerDay);
    if (securityDeposit !== undefined) bike.security_deposit = Number(securityDeposit);
    if (description !== undefined) bike.description = description;
    if (chassisNumber !== undefined) bike.chassis_number = chassisNumber;
    if (engineNumber !== undefined) bike.engine_number = engineNumber;
    if (rcNumber !== undefined) bike.rc_number = rcNumber;
    if (rcDocument !== undefined) bike.rc_book_upload = rcDocument;
    if (insurancePolicyNumber !== undefined) bike.insurance_policy_number = insurancePolicyNumber;
    if (insuranceExpiryDate !== undefined) bike.insurance_expiry_date = insuranceExpiryDate ? new Date(insuranceExpiryDate) : null;
    if (insuranceDocument !== undefined) bike.insurance_document_upload = insuranceDocument;
    if (images !== undefined) bike.images = Array.isArray(images) ? images : [images];
    if (isAvailable !== undefined) bike.availability_status = isAvailable;

    await bike.save();
    res.json({ bike: formatBike(bike, req.shop) });
  } catch (err) {
    console.error('Update bike error:', err);
    res.status(500).json({ error: 'Failed to update bike' });
  }
});

router.patch('/:id/toggle', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    if (!req.shop || bike.shop_id.toString() !== req.shop._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    bike.availability_status = !bike.availability_status;
    await bike.save();
    res.json({ bike: formatBike(bike, req.shop) });
  } catch (err) {
    console.error('Toggle bike error:', err);
    res.status(500).json({ error: 'Failed to toggle availability' });
  }
});

router.delete('/:id', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });
    if (!req.shop || bike.shop_id.toString() !== req.shop._id.toString()) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await bike.deleteOne();
    res.json({ message: 'Bike deleted' });
  } catch (err) {
    console.error('Delete bike error:', err);
    res.status(500).json({ error: 'Failed to delete bike' });
  }
});

router.patch('/:id/verification', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const bike = await Bike.findById(req.params.id);
    if (!bike) return res.status(404).json({ error: 'Bike not found' });

    bike.verification_status = status;
    await bike.save();

    const shop = await Shop.findById(bike.shop_id);
    res.json({ bike: formatBike(bike, shop) });
  } catch (err) {
    console.error('Verify bike error:', err);
    res.status(500).json({ error: 'Failed to update verification' });
  }
});

export default router;
