import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { signToken } from './src/middleware/auth.js';
import Booking from './src/models/Booking.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const booking = await Booking.findById('6a26ed07f906cbc1974a29eb');
  if (!booking) {
    console.log("booking not found");
    return;
  }
  
  const token = signToken({ id: booking.customer_id.toString(), role: 'customer' });

  console.log('Sending POST request to cancel...');
  const res = await fetch(`http://localhost:5001/api/cancel-booking`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ bookingId: booking._id.toString() })
  });
  
  const data = await res.json();
  console.log('Response:', res.status, data);

  await mongoose.disconnect();
}

test().catch(console.error);
