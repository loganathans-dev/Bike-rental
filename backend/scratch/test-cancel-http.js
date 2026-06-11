import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Find a customer booking
  const db = mongoose.connection.db;
  const booking = await db.collection('bookings').findOne({ status: { $in: ['booked', 'upcoming', 'ready', 'on_the_way'] } });
  
  if (!booking) {
    console.log("No bookings found to test cancel");
    process.exit(0);
  }
  
  console.log("Found booking:", booking._id.toString(), "for customer:", booking.customer_id.toString());
  
  const token = jwt.sign({ id: booking.customer_id.toString(), role: 'customer' }, JWT_SECRET, { expiresIn: '1h' });
  
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
  process.exit(0);
}

test().catch(console.error);
