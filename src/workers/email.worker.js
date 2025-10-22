import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import nodemailer from 'nodemailer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { decrypt } from '../services/encryption.service.js';
import User from '../models/User.js';
import Recipient from '../models/Recipient.js';
import 'dotenv/config';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', { maxRetriesPerRequest: null });

export const emailQueue = new Queue('email-queue', { connection });

const emailWorker = new Worker('email-queue', async (job) => {
  const { campaign, recipient, user } = job.data;

  try {
    if (!user.appPassword) {
      throw new Error('User app password is not set.');
    }
    const decryptedPassword = decrypt(user.appPassword);

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Or your email provider
      auth: {
        user: user.senderEmail, // Use the correct sender email field
        pass: decryptedPassword,
      },
    });

    let attachments = [];
    let mailBody = campaign.body.replace(/{{name}}/g, recipient.name).replace(/{{email}}/g, recipient.email);

    if (campaign.emailType === 'pdf' && campaign.pdfTemplate) {
      const pdfDoc = await PDFDocument.load(Buffer.from(campaign.pdfTemplate.data));
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      for (const field of campaign.pdfFields) {
        const text = field.text.replace(/{{name}}/g, recipient.name).replace(/{{email}}/g, recipient.email);
        
        let font;
        try {
            font = await pdfDoc.embedFont(StandardFonts[field.font] || StandardFonts.Helvetica);
        } catch (e) {
            console.warn(`Font ${field.font} not found, falling back to Helvetica.`);
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        }

        const color = field.color || '#000000';
        const r = parseInt(color.slice(1, 3), 16) / 255;
        const g = parseInt(color.slice(3, 5), 16) / 255;
        const b = parseInt(color.slice(5, 7), 16) / 255;

        firstPage.drawText(text, {
          x: Number(field.x),
          y: Number(field.y),
          font: font,
          size: Number(field.size),
          color: rgb(r, g, b),
        });
      }

      const pdfBytes = await pdfDoc.save();
      attachments.push({
        filename: `${recipient.name}-certificate.pdf`,
        content: pdfBytes,
        contentType: 'application/pdf',
      });
    }

    await transporter.sendMail({
      from: `"${user.username}" <${user.email}>`,
      to: recipient.email,
      subject: campaign.subject,
      html: mailBody,
      attachments,
    });

    await Recipient.findByIdAndUpdate(recipient._id, { status: 'sent' });
    console.log(`Email sent to ${recipient.email}`);
  } catch (error) {
    await Recipient.findByIdAndUpdate(recipient._id, { status: 'failed' });
    console.error(`Failed to send email to ${recipient.email}:`, error);
    throw error; // Important: throw error to let BullMQ know the job failed
  }
}, { connection });

emailWorker.on('completed', job => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.log(`Job ${job.id} has failed with ${err.message}`);
});

