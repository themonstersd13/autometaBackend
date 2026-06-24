import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { decrypt } from '../services/encryption.service.js';
import User from '../models/User.js';
import Recipient from '../models/Recipient.js';
import Campaign from '../models/Campaign.js';
import 'dotenv/config';

// Import templates
import { welcomeTemplate } from '../templates/welcomeTemplate.js';
import { newsletterTemplate } from '../templates/newsletterTemplate.js';
import { productPromotionTemplate } from '../templates/productPromotionTemplate.js';
import { simpleAnnouncementTemplate } from '../templates/simpleAnnouncementTemplate.js';

const templateMap = {
  'welcome': welcomeTemplate,
  'newsletter': newsletterTemplate,
  'productPromotion': productPromotionTemplate,
  'simple-announcement': simpleAnnouncementTemplate,
  'simpleAnnouncement': simpleAnnouncementTemplate,
};

const normalizeRecipient = (recipient = {}) => {
  const normalized = {};

  for (const [key, value] of Object.entries(recipient)) {
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

const renderWithRecipient = (content, recipient) => {
  if (!content) {
    return '';
  }

  const compiled = handlebars.compile(String(content));
  return compiled({ ...recipient, ...normalizeRecipient(recipient) });
};

const processEmbeddedImages = (content, attachments) => {
  let processedContent = content || '';
  const imageRegex = /<img src="(data:image\/[^;]+;base64,([^"]+))"/g;
  let match;
  let imageCount = 0;

  while ((match = imageRegex.exec(processedContent)) !== null) {
    const dataUrl = match[1];
    const base64Data = match[2];
    const cid = `image_${Date.now()}_${imageCount++}`;

    attachments.push({
      filename: `image-${imageCount}.png`,
      content: base64Data,
      encoding: 'base64',
      cid: cid
    });

    processedContent = processedContent.replace(dataUrl, `cid:${cid}`);
  }

  return processedContent;
};

// Build Redis URL from env vars
const redisUrl = process.env.REDIS_URL ||
  `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

export const emailQueue = new Queue('email-queue', { connection });

// Helper to update campaign status after each job
const updateCampaignStatus = async (campaignId) => {
  try {
    const totalRecipients = await Recipient.countDocuments({ campaignId });
    const sentCount = await Recipient.countDocuments({ campaignId, status: 'sent' });
    const failedCount = await Recipient.countDocuments({ campaignId, status: 'failed' });
    const pendingCount = totalRecipients - sentCount - failedCount;

    const updateData = { sentCount, failedCount, totalRecipients };

    if (pendingCount <= 0) {
      // All recipients have been processed
      updateData.status = failedCount === totalRecipients ? 'failed' : 'completed';
    }

    await Campaign.findByIdAndUpdate(campaignId, updateData);
  } catch (error) {
    console.error('Error updating campaign status:', error);
  }
};

const emailWorker = new Worker('email-queue', async (job) => {
  const { campaign, recipient, user: userData } = job.data;

  try {
    const recipientContext = { ...recipient, ...normalizeRecipient(recipient) };
    const user = await User.findById(userData._id);
    if (!user) {
      throw new Error(`User with id ${userData._id} not found.`);
    }

    if (!user.appPassword) {
      throw new Error('User app password is not set.');
    }
    const decryptedPassword = decrypt(user.appPassword);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user.senderEmail,
        pass: decryptedPassword,
      },
    });

    let mailBody;
    const mailSubject = renderWithRecipient(campaign.subject, recipientContext) || campaign.subject;
    const attachments = [];

    if (campaign.emailType === 'template' && campaign.templateId) {
      const templateSource = templateMap[campaign.templateId];
      if (!templateSource) {
        throw new Error(`Template with id ${campaign.templateId} not found.`);
      }
      const compiledTemplate = handlebars.compile(templateSource);

      const personalizedBody = renderWithRecipient(campaign.body, recipientContext);
      const processedBody = processEmbeddedImages(personalizedBody, attachments);

      const templateData = {
        ...recipientContext,
        ...campaign.templateCustomization,
        preHeader: renderWithRecipient(campaign.preHeader, recipientContext),
        footerText: renderWithRecipient(campaign.footerText, recipientContext),
        subject: mailSubject,
        body: processedBody,
        unsubscribeLink: '#'
      };
      mailBody = compiledTemplate(templateData);
    } else {
      const personalizedBody = renderWithRecipient(campaign.body, recipientContext);
      const processedBody = processEmbeddedImages(personalizedBody, attachments);
      mailBody = processedBody;
    }

    await transporter.sendMail({
      from: `"${user.username}" <${user.senderEmail}>`,
      to: recipientContext.email,
      subject: mailSubject,
      html: mailBody,
      attachments,
    });

    await Recipient.findByIdAndUpdate(recipient._id, { status: 'sent' });
    console.log(`Email sent to ${recipientContext.email}`);

    // Update campaign status
    await updateCampaignStatus(campaign._id);
  } catch (error) {
    await Recipient.findByIdAndUpdate(recipient._id, { status: 'failed' });
    console.error(`Failed to send email to ${recipientContext.email}:`, error.message);

    // Update campaign status even on failure
    await updateCampaignStatus(campaign._id);
    throw error;
  }
}, { connection });

emailWorker.on('completed', job => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} failed: ${err.message}`);
});

console.log('Email worker is listening for jobs...');
