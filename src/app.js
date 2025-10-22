import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import campaignRoutes from './routes/campaign.js';
import userRoutes from './routes/user.js';

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/user', userRoutes);

export default app;
