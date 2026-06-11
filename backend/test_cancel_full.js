import mongoose from 'mongoose';
import Booking from './src/models/Booking.js';

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/rental');
  try {
    const booking = new Booking({
      customer_id: new mongoose.Types.ObjectId(),
      bike_id: new mongoose.Types.ObjectId(),
      shop_id: new mongoose.Types.ObjectId(),
      start_datetime: new Date(),
      end_datetime: new Date(),
      total_price: 100,
      status: 'booked'
    });
    await booking.save();
    
    // Simulate what the route does:
    const status = 'cancelled';
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      console.log('Error: Booking cannot be cancelled at this stage');
      process.exit(1);
    }
    
    booking.status = status;
    await booking.save();
    console.log("Success! Status is now:", booking.status);
    
    // Clean up
    await Booking.deleteOne({ _id: booking._id });
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
}

run();
