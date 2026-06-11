import mongoose from 'mongoose';
import Booking from '../src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const booking = await Booking.findOne().sort({ created_at: -1 });
  console.log("Latest booking status:", booking.status);
  
  try {
    booking.status = 'cancelled';
    await booking.save();
    console.log("Save successful!");
  } catch (err) {
    console.error("Save failed:", err);
  }
  process.exit(0);
});
