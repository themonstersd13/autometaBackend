import express from 'express';
import auth from '../middlewares/auth.middleware.js';
import { encrypt } from '../services/encryption.service.js';
import User from '../models/User.js';

const router = express.Router();

// Get settings
router.get('/', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password -appPassword');
      res.json(user);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });

// Update settings
router.post('/', auth, async (req, res) => {
  const { email, appPassword } = req.body;
  try {
    const encryptedPassword = encrypt(appPassword);
    await User.findByIdAndUpdate(req.user.id, { email, appPassword: encryptedPassword });
    res.json({ msg: 'Settings updated successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

export default router;
