import mongoose from 'mongoose';

const inspectionSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    before_photos: [{ type: String }],
    after_photos: [{ type: String }],
    damage_notes: { type: String, default: '' },
    damage_amount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending_before', 'before_complete', 'after_pending', 'completed'],
      default: 'pending_before',
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'inspections',
  }
);

export default mongoose.model('Inspection', inspectionSchema);
