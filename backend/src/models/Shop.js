import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema(
  {
    consultancy_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultancy', required: true },
    shop_name: { type: String, required: true, trim: true },
    owner_name: { type: String, required: true, trim: true },
    contact_number: { type: String, default: '' },
    email: { type: String, default: '' },
    gst_number: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    pincode: { type: String, default: '' },
    location_coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    opening_time: { type: String, default: '' },
    closing_time: { type: String, default: '' },
    working_days: { type: String, default: '' },
    shop_logo: { type: String, default: '' },
    shop_banner: { type: String, default: '' },
    shop_front_image: { type: String, default: '' },
    min_age: { type: Number, default: 18 },
    license_required: { type: Boolean, default: true },
    security_deposit_rules: { type: String, default: '' },
    cancellation_policy: { type: String, default: '' },
    late_return_charges: { type: String, default: '' },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'blocked'],
      default: 'pending',
    },
    bank: {
      account_holder_name: { type: String, default: '' },
      account_number: { type: String, default: '' },
      ifsc_code: { type: String, default: '' },
      bank_name: { type: String, default: '' },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'shops',
  }
);

export default mongoose.model('Shop', shopSchema);
