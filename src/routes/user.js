import express from 'express';
import { saveSmtpSettings, getUserStatus, testSmtpConnection } from '../controllers/userController.js';
import auth from '../middlewares/auth.middleware.js';

const router = express.Router();

// @route   POST api/user/save-smtp
// @desc    Save user's SMTP settings (app password)
// @access  Private
router.post('/save-smtp', auth, saveSmtpSettings);

// @route   POST api/user/test-smtp
// @desc    Test user's SMTP credentials
// @access  Private
router.post('/test-smtp', auth, testSmtpConnection);

// @route   GET api/user/status
// @desc    Get user's setup status
// @access  Private
router.get('/status', auth, getUserStatus);


export default router;
