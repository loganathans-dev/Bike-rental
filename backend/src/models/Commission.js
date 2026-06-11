import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    booking_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
    payment_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    total_amount: { type: Number, required: true },
    shop_amount: { type: Number, required: true },
    admin_amount: { type: Number, required: true },
    commission_percentage: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
    paid_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'commissions',
  }
);

export default mongoose.model('Commission', commissionSchema);
