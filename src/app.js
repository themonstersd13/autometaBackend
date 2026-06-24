import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import campaignRoutes from './routes/campaign.js';
import userRoutes from './routes/user.js';

const app = express();

const normalizeOrigin = (value = '') => value.trim().replace(/\/$/, '');

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => normalizeOrigin(origin))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const requestOrigin = normalizeOrigin(origin || '');

    if (!requestOrigin || allowedOrigins.includes(requestOrigin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
}));

// Body parsing with size limit for embedded images
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/', (req, res) => res.json({ status: 'Autometa API Running', version: '1.0.0' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/user', userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ msg: 'Internal server error' });
});

export default app;
