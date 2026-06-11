import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    bike_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike', required: true },
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    start_datetime: { type: Date, required: true },
    end_datetime: { type: Date, required: true },
    rental_type: { type: String, enum: ['hourly', 'daily'], default: 'daily' },
    total_price: { type: Number, required: true },
    status: {
      type: String,
      enum: ['booked', 'ready', 'on_the_way', 'delivered', 'completed', 'cancelled', 'upcoming'],
      default: 'booked',
    },
    pickup_location: { type: String, default: '' },
    customer_name: { type: String, default: '' },
    customer_email: { type: String, default: '' },
    customer_mobile: { type: String, default: '' },
    licence: { type: String, default: '' },
    address: { type: String, default: '' },
    aadhaar: { type: String, default: '' },
    bike_images: [{ type: String }],
    
    // Delivery & Pickup Module
    is_delivery_requested: { type: Boolean, default: false },
    delivery_address: { type: String, default: '' },
    customer_coordinates: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null }
    },
    delivery_charge: { type: Number, default: 0 },
    pickup_requested: { type: Boolean, default: false },
    delivery_staff_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'bookings',
  }
);

export default mongoose.model('Booking', bookingSchema);
