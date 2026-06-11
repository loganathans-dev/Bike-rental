import mongoose from 'mongoose';

const consultancySchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    name: { type: String, default: 'Partner' },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
    collection: 'consultancies',
  }
);

export default mongoose.model('Consultancy', consultancySchema);
