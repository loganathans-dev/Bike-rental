import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';
import Customer from './src/models/Customer.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rental');
  const b = await Booking.findOne({});
  if (!b) console.log("No booking found in DB!");
  else console.log("Booking status:", b.status);
  process.exit(0);
}
run();
