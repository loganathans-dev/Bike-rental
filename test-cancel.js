import mongoose from 'mongoose';
import Booking from './backend/src/models/Booking.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const booking = await Booking.findOne({ status: { $nin: ['cancelled', 'completed'] } });
  if (!booking) {
    console.log("No cancellable bookings found");
    process.exit(0);
  }
  console.log("Found booking:", booking._id, "status:", booking.status);
  try {
    booking.status = 'cancelled';
    await booking.save();
    console.log("Save successful!");
  } catch (err) {
    console.error("Save failed:", err.message);
  }
  process.exit(0);
}
run();
