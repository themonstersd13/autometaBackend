import User from '../models/User.js';
import { encrypt } from '../services/encryption.service.js';
import nodemailer from 'nodemailer';

export const testSmtpConnection = async (req, res) => {
  const { email, appPassword } = req.body;

  if (!email || !appPassword) {
    return res.status(400).json({ msg: 'Email and App Password are required.' });
  }

  // --- THIS IS THE FIX for the app password ---
  // Remove spaces from the app password before using it
  const cleanedAppPassword = appPassword.replace(/\s/g, '');
  // -------------------------------------------

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: email,
        pass: cleanedAppPassword, // Use the cleaned password
      },
    });

    await transporter.verify();

    res.status(200).json({ msg: 'Connection successful!' });
  } catch (error) {
    console.error('SMTP verification error:', error.message);
    if (error.code === 'EAUTH') {
      return res.status(401).json({ msg: 'Invalid credentials. Check email or app password.' });
    }
    res.status(500).json({ msg: 'SMTP connection failed.', error: error.message });
  }
};

export const saveSmtpSettings = async (req, res) => {
  const { email, appPassword } = req.body;
  const userId = req.user.id;

  if (!email || !appPassword) {
    return res.status(400).json({ msg: 'Email and App Password are required.' });
  }

  // Remove spaces from the app password before encrypting it
  const cleanedAppPassword = appPassword.replace(/\s/g, '');

  try {
    const encryptedAppPassword = encrypt(cleanedAppPassword);

    const user = await User.findByIdAndUpdate(
      userId,
      {
        senderEmail: email, // Use the correct field
        appPassword: encryptedAppPassword,
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.status(200).json({ msg: 'Credentials saved successfully!' });
  } catch (error) {
    console.error('Error saving SMTP credentials:', error);
    // Handle potential duplicate key error on other fields if necessary, though less likely now
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'This email is already in use by another account.' });
    }
    res.status(500).json({ msg: 'Error saving credentials.', error: error.message });
  }
};

export const getUserStatus = async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('senderEmail appPassword');
      if (!user) {
        return res.status(404).json({ msg: 'User not found.' });
      }
  
      res.json({
        email: user.senderEmail, // Return the sender email
        hasSmtpCredentials: !!user.appPassword,
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  };
