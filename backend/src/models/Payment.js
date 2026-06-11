import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    consultancy_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy' },
    amount: { type: Number, required: true },
    payment_method: { type: String, default: 'card' },
    payment_status: {
      type: String,
      enum: ['success', 'pending', 'failed', 'flagged'],
      default: 'success',
    },
    transaction_id: { type: String, default: '' },
    paid_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'payments',
  }
);

export default mongoose.model('Payment', paymentSchema);
