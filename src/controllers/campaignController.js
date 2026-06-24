import Campaign from '../models/Campaign.js';
import Recipient from '../models/Recipient.js';
import User from '../models/User.js';
import { emailQueue } from '../workers/email.worker.js';

const normalizeRecipient = (recipientData = {}) => {
  const normalized = {};

  for (const [key, value] of Object.entries(recipientData)) {
    const normalizedKey = key.trim().toLowerCase();

    if (['e-mail', 'email address', 'emailaddress'].includes(normalizedKey)) {
      normalized.email = value;
    } else if (['full name', 'fullname', 'first name', 'first_name', 'given name'].includes(normalizedKey)) {
      normalized.name = value;
    } else {
      normalized[normalizedKey] = value;
    }
  }

  return normalized;
};

// Get all campaigns for the logged-in user
export const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    // For each campaign, get recipient counts
    const campaignsWithCounts = await Promise.all(
      campaigns.map(async (campaign) => {
        const [total, sent, failed] = await Promise.all([
          Recipient.countDocuments({ campaignId: campaign._id }),
          Recipient.countDocuments({ campaignId: campaign._id, status: 'sent' }),
          Recipient.countDocuments({ campaignId: campaign._id, status: 'failed' }),
        ]);
        return {
          ...campaign,
          totalRecipients: total,
          sentCount: sent,
          failedCount: failed,
        };
      })
    );

    res.json(campaignsWithCounts);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ msg: 'Server error while fetching campaigns.' });
  }
};

// Get a single campaign by ID with recipients
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findOne({
      _id: req.params.id,
      userId: req.user.id,
    }).lean();

    if (!campaign) {
      return res.status(404).json({ msg: 'Campaign not found.' });
    }

    const recipients = await Recipient.find({ campaignId: campaign._id })
      .sort({ email: 1 })
      .lean();

    const sentCount = recipients.filter(r => r.status === 'sent').length;
    const failedCount = recipients.filter(r => r.status === 'failed').length;

    res.json({
      ...campaign,
      recipients,
      totalRecipients: recipients.length,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ msg: 'Server error while fetching campaign.' });
  }
};

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
  if (emailType === 'template' && !templateId) {
    return res.status(400).json({ msg: 'Template ID is required for template emails.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user || !user.senderEmail || !user.appPassword) {
      return res.status(400).json({ msg: 'Sender credentials are not configured. Please set up SMTP in Settings.' });
    }

    const validRecipients = (recipients || [])
      .map(normalizeRecipient)
      .filter(recipient => recipient.email);

    if (validRecipients.length === 0) {
      return res.status(400).json({ msg: 'At least one recipient with an email address is required.' });
    }

    // 1. Create and save the campaign
    const newCampaign = new Campaign({
      name: subject,
      subject,
      body: body || '',
      userId,
      emailType: emailType || 'simple',
      templateId,
      preHeader,
      footerText,
      templateCustomization,
      status: 'processing',
      totalRecipients: validRecipients.length,
    });
    await newCampaign.save();

    // 2. Create recipient records and add jobs to the queue
    for (const normalizedRecipientData of validRecipients) {
      const recipientEmail = normalizedRecipientData.email;

      const newRecipient = new Recipient({
        ...normalizedRecipientData,
        campaignId: newCampaign._id,
        status: 'pending',
      });
      await newRecipient.save();

      // Add a job to the queue for this recipient
      await emailQueue.add('send-email', {
        campaign: newCampaign.toObject(),
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

    res.status(200).json({
      msg: 'Campaign started successfully! Emails are being processed.',
      campaignId: newCampaign._id,
    });
  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ msg: 'Server error while starting campaign.', error: error.message });
  }
};
