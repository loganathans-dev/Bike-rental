import mongoose from 'mongoose';

const extensionSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    old_end_time: { type: Date, required: true },
    new_end_time: { type: Date, required: true },
    extra_amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'extensions',
  }
);

export default mongoose.model('Extension', extensionSchema);
