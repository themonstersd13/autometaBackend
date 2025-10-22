import Campaign from '../models/Campaign.js';
import Recipient from '../models/Recipient.js';
import User from '../models/User.js';
import { emailQueue } from '../workers/email.worker.js';

export const startCampaign = async (req, res) => {
  const { 
    subject, 
    body, 
    recipients, 
    emailType, 
    templateId, 
    preHeader, 
    footerText, 
    templateCustomization 
  } = req.body;
  const userId = req.user.id;

  if (!subject || !recipients || recipients.length === 0) {
    return res.status(400).json({ msg: 'Subject and at least one recipient are required.' });
  }
  if (emailType === 'plaintext' && !body) {
    return res.status(400).json({ msg: 'Body is required for plain text emails.' });
  }
  if (emailType === 'template' && !templateId) {
    return res.status(400).json({ msg: 'Template ID is required for template emails.' });
  }


  try {
    const user = await User.findById(userId);
    if (!user || !user.senderEmail || !user.appPassword) {
      return res.status(400).json({ msg: 'User sender credentials are not configured.' });
    }

    // 1. Create and save the campaign
    const newCampaign = new Campaign({
      name: subject,
      subject,
      body,
      userId,
      emailType,
      templateId,
      preHeader,
      footerText,
      templateCustomization,
    });
    await newCampaign.save();

    // 2. Create recipient records and add jobs to the queue
    for (const recipientData of recipients) {
      const recipientEmail = recipientData.email || recipientData.Email;

      if (!recipientEmail) {
        console.warn('Skipping recipient with no email:', recipientData);
        continue;
      }

      const normalizedRecipientData = {
        ...recipientData,
        email: recipientEmail,
      };
      delete normalizedRecipientData.Email;

      const newRecipient = new Recipient({
        ...normalizedRecipientData,
        campaignId: newCampaign._id,
        status: 'queued',
      });
      await newRecipient.save();

      // Add a job to the queue for this recipient
      await emailQueue.add('send-email', {
        campaign: newCampaign.toObject(), // Pass the full campaign object
        recipient: {
          _id: newRecipient._id,
          ...normalizedRecipientData,
        },
        user: {
          _id: user._id,
          senderEmail: user.senderEmail,
          appPassword: user.appPassword,
        },
      });
    }

    res.status(200).json({ msg: 'Campaign started successfully! Emails are being processed.' });

  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ msg: 'Server error while starting campaign.', error: error.message });
  }
};
