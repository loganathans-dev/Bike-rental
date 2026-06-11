import './src/config/loadEnv.js';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import Booking from './src/models/Booking.js';
import Bike from './src/models/Bike.js';
import Payment from './src/models/Payment.js';
import Refund from './src/models/Refund.js';
import { calculateRefundAmount } from './src/services/cancellation.js';
import { writeAudit } from './src/utils/audit.js';

async function run() {
  await connectDB();
  
  const booking = await Booking.findOne({ status: { $nin: ['cancelled', 'completed'] } });
  if (!booking) {
    console.log('No active booking found');
    process.exit(0);
  }
  
  const payment = await Payment.findOne({
    booking_id: booking._id,
    payment_status: 'success',
  });
  
  const paidAmount = payment?.amount ?? booking.total_price;
  const { refundAmount, refundPercentage, reason } = calculateRefundAmount(booking, paidAmount);
  
  booking.status = 'cancelled';
  
  try {
    await booking.save();
    console.log('Booking saved');
    
    await Bike.findByIdAndUpdate(booking.bike_id, { availability_status: true });
    console.log('Bike updated');
    
    const refund = await Refund.create({
      booking_id: booking._id,
      customer_id: booking.customer_id,
      refund_amount: refundAmount,
      refund_percentage: refundPercentage,
      refund_status: refundAmount > 0 ? 'processed' : 'processed',
      reason,
      processed_at: new Date(),
    });
    console.log('Refund created');
    
    await writeAudit({
      action: 'booking_cancelled',
      entityType: 'booking',
      entityId: booking._id,
      user: { id: booking.customer_id, role: 'customer' },
      details: { refundAmount, refundPercentage, reason },
    });
    console.log('Audit written');
    
    console.log('SUCCESS');
  } catch (err) {
    console.error('Error during cancellation flow:', err);
  }
  
  process.exit(0);
}

run();
