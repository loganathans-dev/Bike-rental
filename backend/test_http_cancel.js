import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Booking from './src/models/Booking.js';
import Customer from './src/models/Customer.js';
import Bike from './src/models/Bike.js';
import Shop from './src/models/Shop.js';

dotenv.config();

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rental');
  try {
    const customer = await Customer.create({ full_name: 'Test', email: `test${Date.now()}@test.com`, password_hash: '123', phone: '123456' });
    const shop = await Shop.create({ 
      shop_name: 'Test', 
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
      start_datetime: new Date(),
      end_datetime: new Date(),
      total_price: 100,
      status: 'booked'
    });
    
    const token = jwt.sign({ id: customer._id.toString(), role: 'customer' }, process.env.JWT_SECRET || 'dev-secret-change-me', { expiresIn: '1h' });
    
    console.log("Created booking, making API request to cancel...");
    
    const res = await fetch(`http://localhost:5001/api/bookings/${booking._id.toString()}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    
    const data = await res.json();
    console.log("API Response:", res.status, data);
    
    // Clean up
    await Booking.deleteOne({ _id: booking._id });
    await Customer.deleteOne({ _id: customer._id });
    await Shop.deleteOne({ _id: shop._id });
    await Bike.deleteOne({ _id: bike._id });
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
