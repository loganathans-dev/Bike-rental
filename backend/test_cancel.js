import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import { calculateRefundAmount } from './src/services/cancellation.js';

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const booking = await Booking.findById('6a26ed07f906cbc1974a29eb');
  if (!booking) {
    console.log("booking not found");
    return;
  }
  console.log("Booking found:", booking.status);
  
  const paymentAmount = booking.total_price;
  console.log("Paid amount:", paymentAmount);
  
  try {
    const refundInfo = calculateRefundAmount(booking, paymentAmount);
    console.log("Refund info:", refundInfo);
  } catch (e) {
    console.error("calculateRefundAmount threw an error:", e);
  }

  await mongoose.disconnect();
}

test().catch(console.error);
