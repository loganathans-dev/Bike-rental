import './src/config/loadEnv.js';
import connectDB from './src/config/db.js';
import Shop from './src/models/Shop.js';

async function check() {
  await connectDB();
  const shops = await Shop.find();
  console.log('Shops:', shops.map(s => ({ name: s.shop_name, status: s.status })));
  process.exit(0);
}
check();
