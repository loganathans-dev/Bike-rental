import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, default: 'Admin' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'admins',
  }
);

export default mongoose.model('Admin', adminSchema);
