import express from 'express';
import { startCampaign } from '../controllers/campaignController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// @route   POST api/campaigns/start
// @desc    Start a new email campaign
// @access  Private
router.post('/start', auth, startCampaign);

export default router;
