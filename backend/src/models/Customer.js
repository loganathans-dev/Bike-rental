import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    full_name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    password_hash: { type: String, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'customers',
  }
);

export default mongoose.model('Customer', customerSchema);
