import Campaign from '../models/Campaign.js';
import Recipient from '../models/Recipient.js';
import User from '../models/User.js';
import { emailQueue } from '../workers/email.worker.js';

export const startCampaign = async (req, res) => {
  const { subject, body, recipients } = req.body;
  const userId = req.user.id;

  if (!subject || !body || !recipients || recipients.length === 0) {
    return res.status(400).json({ msg: 'Subject, body, and at least one recipient are required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.senderEmail || !user.appPassword) {
      return res.status(400).json({ msg: 'User sender credentials are not configured.' });
    }

    // 1. Create and save the campaign
    const newCampaign = new Campaign({
      name: subject, // Use subject as the campaign name
      subject,
      body,
      userId: userId,
    });
    await newCampaign.save();

    // 2. Create recipient records and add jobs to the queue
    for (const recipientData of recipients) {
      // Handle case-insensitivity for the email field
      const recipientEmail = recipientData.email || recipientData.Email;

      // Ensure recipientData has at least an email
      if (!recipientEmail) {
        console.warn('Skipping recipient with no email:', recipientData);
        continue;
      }

      // Normalize the recipient data to ensure 'email' is lowercase
      const normalizedRecipientData = {
        ...recipientData,
        email: recipientEmail,
      };
      // Remove the capitalized 'Email' if it exists to avoid confusion
      delete normalizedRecipientData.Email;


      const newRecipient = new Recipient({
        ...normalizedRecipientData,
        campaignId: newCampaign._id, // Corrected from 'campaign' to 'campaignId'
        status: 'queued',
      });
      await newRecipient.save();

      // Add a job to the queue for this recipient
      await emailQueue.add('send-email', {
        campaign: {
          subject: newCampaign.subject,
          body: newCampaign.body,
        },
        recipient: {
          _id: newRecipient._id,
          ...normalizedRecipientData,
        },
        user: {
          _id: user._id,
          senderEmail: user.senderEmail,
          appPassword: user.appPassword, // The worker will decrypt this
        },
      });
    }

    res.status(200).json({ msg: 'Campaign started successfully! Emails are being processed.' });

  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ msg: 'Server error while starting campaign.', error: error.message });
  }
};
