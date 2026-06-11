import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    shop_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    name: { type: String, required: true },
    role: { 
      type: String, 
      enum: ['Manager', 'Delivery Boy', 'Accountant'], 
      required: true 
    },
    phone: { type: String, required: true },
    email: { type: String },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'staff'
  }
);

export default mongoose.model('Staff', staffSchema);
