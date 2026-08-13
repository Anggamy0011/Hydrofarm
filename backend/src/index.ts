import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import couponRoutes from './routes/couponRoutes';
import orderRoutes from './routes/orderRoutes';
import paymentRoutes from './routes/paymentRoutes';
import { errorHandler } from './middlewares/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import path from 'path';

// Serve Static Frontend Files
const frontendPath = path.join(__dirname, '../../frontend');
app.use('/main', express.static(path.join(frontendPath, 'main')));
app.use('/admin', express.static(path.join(frontendPath, 'admin')));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'HydroFarm Backend API Service',
    timestamp: new Date().toISOString()
  });
});

// Root Redirect to Main Store
app.get('/', (req, res) => {
  res.redirect('/main');
});

// API V1 Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', productRoutes);
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🌱 HydroFarm Backend API Server is running!`);
    console.log(`🚀 URL: http://localhost:${PORT}`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
    console.log(`====================================================`);
  });
}

export default app;
