import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { decrypt } from '../services/encryption.service.js';
import User from '../models/User.js';
import Recipient from '../models/Recipient.js';
import 'dotenv/config';

// Import templates
import { welcomeTemplate } from '../templates/welcomeTemplate.js';
import { newsletterTemplate } from '../templates/newsletterTemplate.js';
import { productPromotionTemplate } from '../templates/productPromotionTemplate.js';
import { simpleAnnouncementTemplate } from '../templates/simpleAnnouncementTemplate.js';

const templates = {
  'welcome': welcomeTemplate,
  'newsletter': newsletterTemplate,
  'productPromotion': productPromotionTemplate,
  'simple-announcement': simpleAnnouncementTemplate,
};

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const emailQueue = new Queue('email-queue', { connection });

const emailWorker = new Worker('email-queue', async (job) => {
  const { campaign, recipient, user: userData } = job.data;

  try {
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
    const attachments = []; // Initialize attachments array

    if (campaign.emailType === 'template' && campaign.templateId) {
      const templateSource = templates[campaign.templateId];
      if (!templateSource) {
        throw new Error(`Template with id ${campaign.templateId} not found.`);
      }
      const compiledTemplate = handlebars.compile(templateSource);
      
      // Process body for embedded images
      let processedBody = campaign.body;
      const imageRegex = /<img src="(data:image\/[^;]+;base64,([^"]+))"/g;
      let match;
      let imageCount = 0;
      while ((match = imageRegex.exec(processedBody)) !== null) {
        const dataUrl = match[1];
        const base64Data = match[2];
        const cid = `image_${Date.now()}_${imageCount++}`;
        
        attachments.push({
          filename: `image-${imageCount}.png`, // Filename is not crucial but good practice
          content: base64Data,
          encoding: 'base64',
          cid: cid
        });

        processedBody = processedBody.replace(dataUrl, `cid:${cid}`);
      }

      const templateData = {
        ...recipient,
        ...campaign.templateCustomization,
        preHeader: campaign.preHeader,
        footerText: campaign.footerText,
        subject: campaign.subject,
        body: processedBody, // Use the processed body
        unsubscribeLink: '#'
      };
      mailBody = compiledTemplate(templateData);
    } else {
      // Fallback for plain text, also needs image processing
      let processedBody = campaign.body.replace(/{{name}}/g, recipient.name || '').replace(/{{email}}/g, recipient.email || '');
      const imageRegex = /<img src="(data:image\/[^;]+;base64,([^"]+))"/g;
      let match;
      let imageCount = 0;
      while ((match = imageRegex.exec(processedBody)) !== null) {
        const dataUrl = match[1];
        const base64Data = match[2];
        const cid = `image_${Date.now()}_${imageCount++}`;
        
        attachments.push({
          filename: `image-${imageCount}.png`,
          content: base64Data,
          encoding: 'base64',
          cid: cid
        });

        processedBody = processedBody.replace(dataUrl, `cid:${cid}`);
      }
      mailBody = processedBody;
    }

    await transporter.sendMail({
      from: `"${user.username}" <${user.senderEmail}>`,
      to: recipient.email,
      subject: campaign.subject,
      html: mailBody,
      attachments, // Pass the attachments to nodemailer
    });

    await Recipient.findByIdAndUpdate(recipient._id, { status: 'sent' });
    console.log(`Email sent to ${recipient.email}`);
  } catch (error) {
    await Recipient.findByIdAndUpdate(recipient._id, { status: 'failed' });
    console.error(`Failed to send email to ${recipient.email}:`, error);
    throw error;
  }
}, { connection });

emailWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});

