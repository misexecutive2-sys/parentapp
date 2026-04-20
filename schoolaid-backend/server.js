require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { PORT } = require('./config');
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');

const app = express();
const Razorpay = require("razorpay");
const razorpay = new Razorpay({
  key_id: "rzp_test_SfdKW9Z1bQ1ZGK",       // your test key_id
  key_secret: "7EvqiBTU4E6jY80iy5RTS6HJ", // keep this safe
});

app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.disable('x-powered-by');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childrenRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));
app.use((err, _req, res, _next) => {
  console.error('[UnhandledError]', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
