import mongoose from 'mongoose';

const bikeSchema = new mongoose.Schema(
  {
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    bike_name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    vehicle_number: { type: String, default: '' },
    category: { type: String, default: 'Cruiser' },
    fuel_type: { type: String, default: 'Petrol' },
    mileage: { type: String, default: '' },
    price_per_hour: { type: Number, default: 0 },
    price_per_day: { type: Number, default: 0 },
    security_deposit: { type: Number, default: 0 },
    chassis_number: { type: String, default: '' },
    engine_number: { type: String, default: '' },
    rc_number: { type: String, default: '' },
    rc_book_upload: { type: String, default: '' },
    insurance_policy_number: { type: String, default: '' },
    insurance_expiry_date: { type: Date },
    insurance_document_upload: { type: String, default: '' },
    description: { type: String, default: '' },
    images: [{ type: String }],
    availability_status: { type: Boolean, default: true },
    verification_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    rating: { type: Number, default: 4.5 },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'bikes',
  }
);

export default mongoose.model('Bike', bikeSchema);
