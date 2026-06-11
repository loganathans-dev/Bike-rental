import './src/config/loadEnv.js';
import connectDB from './src/config/db.js';
import mongoose from 'mongoose';

async function check() {
  await connectDB();
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const c of collections) {
    const count = await db.collection(c.name).countDocuments();
    console.log(`Collection ${c.name}: ${count} documents`);
  }
  process.exit(0);
}
check();
