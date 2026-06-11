import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    bike_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'reviews',
  }
);

reviewSchema.index({ customer_id: 1, booking_id: 1 }, { unique: true });
reviewSchema.index({ bike_id: 1 });

export default mongoose.model('Review', reviewSchema);
