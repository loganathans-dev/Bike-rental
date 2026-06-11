import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const bookings = await db.collection('bookings').find({}).toArray();
  console.log("Total bookings:", bookings.length);
  for (const b of bookings) {
    console.log("Booking ID:", b._id.toString(), "Status:", b.status);
  }
  process.exit(0);
}
test().catch(console.error);
