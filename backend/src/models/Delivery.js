import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    delivery_address: { type: String, required: true },
    delivery_charge: { type: Number, default: 0 },
    delivery_status: {
      type: String,
      enum: ['pending', 'assigned', 'in_transit', 'delivered', 'cancelled'],
      default: 'pending',
    },
    assigned_staff: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'deliveries',
  }
);

deliverySchema.index({ booking_id: 1 });

export default mongoose.model('Delivery', deliverySchema);
