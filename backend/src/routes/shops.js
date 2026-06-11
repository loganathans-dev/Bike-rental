import { Router } from 'express';
import Shop from '../models/Shop.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { formatShop } from '../utils/formatters.js';

const router = Router();

router.get('/', authenticate, requireRole('admin'), async (_req, res) => {
  try {
    const shops = await Shop.find().sort({ created_at: -1 });
    res.json({ shops: shops.map(formatShop) });
  } catch (err) {
    console.error('List shops error:', err);
    res.status(500).json({ error: 'Failed to load shops' });
  }
});

router.post('/', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const existing = await Shop.findOne({ consultancy_id: req.user.id });
    if (existing) {
      return res.status(409).json({ error: 'Shop already registered for this account' });
    }

    const {
      shopName, ownerName, contactNumber, email, gstNumber,
      address, city, state, pincode, openingTime, closingTime, workingDays,
      shopLogo, shopBanner, shopFrontImage,
      minimumAge, licenseRequired, securityDepositRules,
      cancellationPolicy, lateReturnCharges,
      accountHolderName, accountNumber, ifscCode, bankName,
      locationLat, locationLng,
    } = req.body;

    const shop = await Shop.create({
      consultancy_id: req.user.id,
      shop_name: shopName,
      owner_name: ownerName,
      contact_number: contactNumber || '',
      email: email || req.user.email,
      gst_number: gstNumber || '',
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      opening_time: openingTime || '',
      closing_time: closingTime || '',
      working_days: workingDays || '',
      shop_logo: shopLogo || '',
      shop_banner: shopBanner || '',
      shop_front_image: shopFrontImage || '',
      min_age: Number(minimumAge) || 18,
      license_required: licenseRequired !== 'No',
      security_deposit_rules: securityDepositRules || '',
      cancellation_policy: cancellationPolicy || '',
      late_return_charges: lateReturnCharges || '',
      status: 'pending',
      bank: {
        account_holder_name: accountHolderName || '',
        account_number: accountNumber || '',
        ifsc_code: ifscCode || '',
        bank_name: bankName || '',
      },
      location_coordinates: {
        lat: locationLat !== undefined ? Number(locationLat) : null,
        lng: locationLng !== undefined ? Number(locationLng) : null,
      },
    });

    res.status(201).json({ shop: formatShop(shop) });
  } catch (err) {
    console.error('Register shop error:', err);
    res.status(500).json({ error: 'Failed to register shop' });
  }
});

router.put('/mine', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ consultancy_id: req.user.id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    const {
      shopName, ownerName, contactNumber, email, gstNumber,
      address, city, state, pincode, openingTime, closingTime, workingDays,
      shopLogo, shopBanner, shopFrontImage,
      minimumAge, licenseRequired, securityDepositRules,
      cancellationPolicy, lateReturnCharges,
      accountHolderName, accountNumber, ifscCode, bankName,
      locationLat, locationLng,
    } = req.body;

    if (shopName !== undefined) shop.shop_name = shopName;
    if (ownerName !== undefined) shop.owner_name = ownerName;
    if (contactNumber !== undefined) shop.contact_number = contactNumber;
    if (email !== undefined) shop.email = email;
    if (gstNumber !== undefined) shop.gst_number = gstNumber;
    if (address !== undefined) shop.address = address;
    if (city !== undefined) shop.city = city;
    if (state !== undefined) shop.state = state;
    if (pincode !== undefined) shop.pincode = pincode;
    if (openingTime !== undefined) shop.opening_time = openingTime;
    if (closingTime !== undefined) shop.closing_time = closingTime;
    if (workingDays !== undefined) shop.working_days = workingDays;
    if (shopLogo !== undefined) shop.shop_logo = shopLogo;
    if (shopBanner !== undefined) shop.shop_banner = shopBanner;
    if (shopFrontImage !== undefined) shop.shop_front_image = shopFrontImage;
    if (minimumAge !== undefined) shop.min_age = Number(minimumAge) || 18;
    if (licenseRequired !== undefined) shop.license_required = licenseRequired !== 'No';
    if (securityDepositRules !== undefined) shop.security_deposit_rules = securityDepositRules;
    if (cancellationPolicy !== undefined) shop.cancellation_policy = cancellationPolicy;
    if (lateReturnCharges !== undefined) shop.late_return_charges = lateReturnCharges;
    if (accountHolderName !== undefined) shop.bank.account_holder_name = accountHolderName;
    if (accountNumber !== undefined) shop.bank.account_number = accountNumber;
    if (ifscCode !== undefined) shop.bank.ifsc_code = ifscCode;
    if (bankName !== undefined) shop.bank.bank_name = bankName;
    if (locationLat !== undefined && locationLng !== undefined) {
      shop.location_coordinates = { lat: Number(locationLat), lng: Number(locationLng) };
    }

    await shop.save();
    res.json({ shop: formatShop(shop) });
  } catch (err) {
    console.error('Update shop error:', err);
    res.status(500).json({ error: 'Failed to update shop' });
  }
});

router.get('/mine', authenticate, requireRole('consultancy'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ consultancy_id: req.user.id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json({ shop: formatShop(shop) });
  } catch (err) {
    console.error('Get my shop error:', err);
    res.status(500).json({ error: 'Failed to load shop' });
  }
});

router.patch('/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ error: 'Shop not found' });

    shop.status = status;
    await shop.save();
    res.json({ shop: formatShop(shop) });
  } catch (err) {
    console.error('Update shop status error:', err);
    res.status(500).json({ error: 'Failed to update shop status' });
  }
});

export default router;
