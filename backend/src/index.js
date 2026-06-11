import './config/loadEnv.js';
import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import bikesRoutes from './routes/bikes.js';
import shopsRoutes from './routes/shops.js';
import bookingsRoutes from './routes/bookings.js';
import paymentsRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import staffRoutes from './routes/staff.js';
import deliveriesRoutes from './routes/deliveries.js';
import inspectionsRoutes from './routes/inspections.js';
import reviewsRoutes from './routes/reviews.js';
import dashboardRoutes from './routes/dashboard.js';
import commissionsRoutes from './routes/commissions.js';
import extensionsRoutes from './routes/extensions.js';
import cancellationsRoutes from './routes/cancellations.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    storage: 'mongodb',
    database: 'rental',
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    message: 'MongoDB Atlas API (not the old db.json server)',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikesRoutes);
app.use('/api/shops', shopsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/deliveries', deliveriesRoutes);
app.use('/api/inspection', inspectionsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/commissions', commissionsRoutes);
app.use('/api/extensions', extensionsRoutes);
app.use('/api', cancellationsRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`MongoDB API running at http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health (must show storage: "mongodb")`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
