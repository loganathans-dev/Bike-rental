import mongoose from 'mongoose';
import Booking from '../src/models/Booking.js';
import Shop from '../src/models/Shop.js';
import Bike from '../src/models/Bike.js';
import Customer from '../src/models/Customer.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const customer = await Customer.findOne();
  const shop = await Shop.findOne();
  const bike = await Bike.findOne();
  
  const booking = await Booking.create({
    customer_id: customer._id,
    bike_id: bike._id,
    shop_id: shop._id,
    start_datetime: new Date(),
    end_datetime: new Date(),
    total_price: 100,
    status: 'booked',
  });
  
  console.log("Created mock booking:", booking._id.toString());
  
  const token = jwt.sign({ id: customer._id.toString(), role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });
  
  const res = await fetch(`http://localhost:5000/api/bookings/${booking._id.toString()}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'cancelled' })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
  
  await Booking.findByIdAndDelete(booking._id);
  process.exit(0);
}
test().catch(console.error);
