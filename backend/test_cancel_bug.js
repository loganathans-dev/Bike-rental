import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Booking from './src/models/Booking.js';
import Customer from './src/models/Customer.js';
import Bike from './src/models/Bike.js';
import Shop from './src/models/Shop.js';
import Payment from './src/models/Payment.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const customer = await Customer.create({ full_name: 'Test Cancel', email: `testcancel${Date.now()}@test.com`, password_hash: '123', phone: '123456' });
    const shop = await Shop.create({ 
      shop_name: 'Test Cancel Shop', 
      consultancy_id: new mongoose.Types.ObjectId(),
      owner_name: 'Test',
      contact_number: '123456',
      address: 'Test',
      city: 'Test',
      pincode: '123456'
    });
    const bike = await Bike.create({ 
      shop_id: shop._id, 
      bike_name: 'Test Bike',
      brand: 'Test',
      category: 'Scooter',
      fuel_type: 'Petrol',
      price_per_hour: 10,
      price_per_day: 100
    });

    const booking = await Booking.create({
      customer_id: customer._id,
      bike_id: bike._id,
      shop_id: shop._id,
      start_datetime: new Date(Date.now() + 48 * 3600 * 1000), // 48h from now
      end_datetime: new Date(Date.now() + 72 * 3600 * 1000),
      total_price: 100,
      status: 'booked'
    });
    
    // Create payment so cancellation finds it
    await Payment.create({
      booking_id: booking._id,
      customer_id: customer._id,
      amount: 100,
      payment_status: 'success'
    });

    const token = jwt.sign({ id: customer._id.toString(), role: 'customer' }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '1h' });
    
    console.log("Making POST /api/cancel-booking...");
    const res = await fetch(`http://localhost:5001/api/cancel-booking`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookingId: booking._id.toString() })
    });
    
    const data = await res.json();
    console.log("Status code:", res.status);
    console.log("Response:", data);
    
    // Clean up
    await Booking.deleteOne({ _id: booking._id });
    await Customer.deleteOne({ _id: customer._id });
    await Shop.deleteOne({ _id: shop._id });
    await Bike.deleteOne({ _id: bike._id });
    await Payment.deleteOne({ booking_id: booking._id });
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
