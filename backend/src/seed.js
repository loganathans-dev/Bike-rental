import './config/loadEnv.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Admin from './models/Admin.js';
import Customer from './models/Customer.js';
import Consultancy from './models/Consultancy.js';
import Shop from './models/Shop.js';
import Bike from './models/Bike.js';
import Booking from './models/Booking.js';
import Payment from './models/Payment.js';
import Refund from './models/Refund.js';
import Staff from './models/Staff.js';
import AuditLog from './models/AuditLog.js';
import Commission from './models/Commission.js';

const DEMO_PASSWORD = 'password123';

async function seed() {
  await connectDB();
  
  // Clear existing data (optional, but good for a fresh seed)
  await Promise.all([
    Admin.deleteMany({}),
    Customer.deleteMany({}),
    Consultancy.deleteMany({}),
    Shop.deleteMany({}),
    Bike.deleteMany({}),
    Booking.deleteMany({}),
    Payment.deleteMany({}),
    Refund.deleteMany({}),
    Staff.deleteMany({}),
    AuditLog.deleteMany({}),
    Commission.deleteMany({}),
  ]);

  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // 1. Create Admin
  const admin = await Admin.create({ 
    email: 'admin@test.com', 
    password_hash: hash, 
    name: 'Super Admin' 
  });

  // 2. Create Customers
  const customer1 = await Customer.create({
    full_name: 'John Doe',
    email: 'customer@test.com',
    phone: '9876543210',
    password_hash: hash,
  });

  const customer2 = await Customer.create({
    full_name: 'Jane Smith',
    email: 'jane@test.com',
    phone: '9988776655',
    password_hash: hash,
  });

  // 3. Create Partner (Consultancy)
  const partner = await Consultancy.create({ 
    email: 'partner@test.com', 
    password_hash: hash, 
    name: 'Velocity Rentals Partner' 
  });

  // 4. Create Shops
  const shop1 = await Shop.create({
    consultancy_id: partner._id,
    shop_name: 'Velocity Bikes Downtown',
    owner_name: 'Mike Johnson',
    contact_number: '9123456780',
    email: 'downtown@velocity.com',
    address: '123 Main St, Downtown',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    status: 'approved',
    opening_time: '08:00',
    closing_time: '22:00',
    working_days: 'Monday to Sunday',
    min_age: 18,
    license_required: true,
  });

  const shop2 = await Shop.create({
    consultancy_id: partner._id,
    shop_name: 'Velocity Bikes Airport',
    owner_name: 'Sarah Connor',
    contact_number: '9123456781',
    email: 'airport@velocity.com',
    address: 'Near Terminal 1',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560300',
    status: 'pending', // Pending verification
    opening_time: '06:00',
    closing_time: '23:59',
  });

  // 5. Create Staff
  const staff1 = await Staff.create({
    shop_id: shop1._id,
    name: 'Delivery Dave',
    role: 'Delivery Boy',
    phone: '8000000001',
    status: 'Active',
  });

  const staff2 = await Staff.create({
    shop_id: shop1._id,
    name: 'Inspector Gadget',
    role: 'Manager',
    phone: '8000000002',
    status: 'Active',
  });

  // 6. Create Bikes
  const bike1 = await Bike.create({
    shop_id: shop1._id,
    bike_name: 'Royal Enfield Classic 350',
    brand: 'Royal Enfield',
    vehicle_number: 'KA01AB1234',
    category: 'Cruiser',
    fuel_type: 'Petrol',
    mileage: '35 kmpl',
    price_per_hour: 150,
    price_per_day: 1200,
    security_deposit: 2000,
    availability_status: true,
    verification_status: 'approved',
    images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&q=80'],
    rating: 4.8,
  });

  const bike2 = await Bike.create({
    shop_id: shop1._id,
    bike_name: 'Honda Activa 6G',
    brand: 'Honda',
    vehicle_number: 'KA01XY9876',
    category: 'Scooter',
    fuel_type: 'Petrol',
    mileage: '45 kmpl',
    price_per_hour: 80,
    price_per_day: 600,
    security_deposit: 1000,
    availability_status: false, // Currently booked
    verification_status: 'approved',
    images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&q=80'],
    rating: 4.5,
  });

  const bike3 = await Bike.create({
    shop_id: shop1._id,
    bike_name: 'KTM Duke 390',
    brand: 'KTM',
    vehicle_number: 'KA05CD5555',
    category: 'Sports',
    fuel_type: 'Petrol',
    mileage: '25 kmpl',
    price_per_hour: 250,
    price_per_day: 2000,
    security_deposit: 3000,
    availability_status: true,
    verification_status: 'pending',
    images: ['https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=500&q=80'],
    rating: 4.9,
  });

  // 7. Create Bookings & Payments
  const now = new Date();
  const pastStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // 2 days ago
  const pastEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
  const futureStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // tomorrow
  const futureEnd = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  // Booking 1: Completed
  const booking1 = await Booking.create({
    customer_id: customer1._id,
    shop_id: shop1._id,
    bike_id: bike1._id,
    customer_name: customer1.full_name,
    customer_mobile: customer1.phone,
    customer_email: customer1.email,
    start_datetime: pastStart,
    end_datetime: pastEnd,
    total_price: 1200, // 1 day
    status: 'completed',
    rental_type: 'daily',
    pickup_location: 'Shop',
  });

  const payment1 = await Payment.create({
    booking_id: booking1._id,
    customer_id: customer1._id,
    consultancy_id: partner._id,
    amount: 1200,
    payment_method: 'razorpay',
    payment_status: 'success',
    transaction_id: 'pay_MOCK123456',
    paid_at: pastStart,
  });

  await Commission.create({
    booking_id: booking1._id,
    payment_id: payment1._id,
    shop_id: shop1._id,
    total_amount: 1200,
    commission_percentage: 10,
    admin_amount: 120,
    shop_amount: 1080,
  });

  // Booking 2: Currently Active (Booked)
  const booking2 = await Booking.create({
    customer_id: customer2._id,
    shop_id: shop1._id,
    bike_id: bike2._id,
    customer_name: customer2.full_name,
    customer_mobile: customer2.phone,
    customer_email: customer2.email,
    start_datetime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // started 2 hours ago
    end_datetime: new Date(now.getTime() + 22 * 60 * 60 * 1000), // ends in 22 hours
    total_price: 600, // 1 day Activa
    status: 'booked',
    rental_type: 'daily',
    pickup_location: 'Shop',
  });

  const payment2 = await Payment.create({
    booking_id: booking2._id,
    customer_id: customer2._id,
    consultancy_id: partner._id,
    amount: 600,
    payment_method: 'razorpay',
    payment_status: 'success',
    transaction_id: 'pay_MOCK987654',
    paid_at: new Date(now.getTime() - 2 * 60 * 60 * 1000),
  });

  await Commission.create({
    booking_id: booking2._id,
    payment_id: payment2._id,
    shop_id: shop1._id,
    total_amount: 600,
    commission_percentage: 10,
    admin_amount: 60,
    shop_amount: 540,
  });

  // Booking 3: Cancelled (With Refund)
  const booking3 = await Booking.create({
    customer_id: customer1._id,
    shop_id: shop1._id,
    bike_id: bike3._id, // Duke
    customer_name: customer1.full_name,
    customer_mobile: customer1.phone,
    customer_email: customer1.email,
    start_datetime: futureStart,
    end_datetime: futureEnd,
    total_price: 2000,
    status: 'cancelled',
    rental_type: 'daily',
  });

  const payment3 = await Payment.create({
    booking_id: booking3._id,
    customer_id: customer1._id,
    consultancy_id: partner._id,
    amount: 2000,
    payment_method: 'razorpay',
    payment_status: 'success',
    transaction_id: 'pay_MOCKCANCELLED',
    paid_at: new Date(now.getTime() - 5 * 60 * 60 * 1000), // paid 5 hours ago
  });

  // Create Refund for Booking 3
  await Refund.create({
    booking_id: booking3._id,
    customer_id: customer1._id,
    refund_amount: 1900, // 95% refund (5% commission taken due to > 1hr)
    refund_percentage: 95,
    refund_status: 'processed',
    reason: 'customer_request',
    processed_at: now,
  });

  await AuditLog.create({
    action: 'booking_cancelled',
    entity_type: 'booking',
    entity_id: booking3._id,
    user_id: customer1._id,
    user_role: 'customer',
    details: { refundAmount: 1900, refundPercentage: 95, reason: 'customer_request' },
  });

  console.log('Seed complete with realistic data!');
  console.log('====================================');
  console.log('Demo accounts (password: password123):');
  console.log('  Admin:    admin@test.com');
  console.log('  Customer: customer@test.com');
  console.log('  Partner:  partner@test.com');
  console.log('====================================');
  console.log('Generated:');
  console.log(' - 2 Shops (1 approved, 1 pending)');
  console.log(' - 3 Bikes (2 approved, 1 pending)');
  console.log(' - 3 Bookings (1 completed, 1 active, 1 cancelled)');
  console.log(' - 3 Payments & Commissions');
  console.log(' - 1 Processed Refund');
  
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
