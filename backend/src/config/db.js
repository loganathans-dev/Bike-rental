import mongoose from 'mongoose';
import { validateEnv } from './validateEnv.js';

export async function connectDB() {
  validateEnv();

  const uri = process.env.MONGODB_URI;

  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected (database: rental)');
  } catch (err) {
    if (err.message?.includes('authentication failed')) {
      throw new Error(
        'MongoDB authentication failed. Check the password in MONGODB_URI matches your Atlas database user password.'
      );
    }
    if (err.message?.includes('ECONNREFUSED') || err.code === 'ECONNREFUSED') {
      throw new Error(
        'Cannot reach MongoDB Atlas. Check internet, Atlas IP allowlist (Network Access → allow your IP or 0.0.0.0/0 for dev), and the connection string.'
      );
    }
    throw err;
  }
}

export default connectDB;
