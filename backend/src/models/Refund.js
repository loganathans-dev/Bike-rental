import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    refund_amount: { type: Number, required: true },
    refund_percentage: { type: Number, required: true },
    refund_status: {
      type: String,
      enum: ['pending', 'processed', 'failed'],
      default: 'pending',
    },
    admin_commission: { type: Number, default: 0 },
    customer_payout: { type: Number, default: 0 },
    customer_reason: { type: String, default: '' },
    refund_method: { type: String, enum: ['bank', 'upi'], required: true },
    refund_details: {
      type: Object,
      default: {},
    },
    reason: { type: String, default: 'cancellation' },
    processed_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'refunds',
  }
);

export default mongoose.model('Refund', refundSchema);
