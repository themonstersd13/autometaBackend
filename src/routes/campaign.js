import express from 'express';
import { startCampaign, getCampaigns, getCampaignById } from '../controllers/campaignController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// @route   GET api/campaigns
// @desc    Get all campaigns for logged-in user
// @access  Private
router.get('/', auth, getCampaigns);

// @route   GET api/campaigns/:id
// @desc    Get a single campaign with recipients
// @access  Private
router.get('/:id', auth, getCampaignById);

// @route   POST api/campaigns/start
// @desc    Start a new email campaign
// @access  Private
router.post('/start', auth, startCampaign);

export default router;
