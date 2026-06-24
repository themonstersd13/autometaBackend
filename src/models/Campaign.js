import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  subject: { type: String, required: true },
  body: { type: String, default: '' },
  emailType: { type: String, enum: ['simple', 'html', 'template'], default: 'simple' },
  templateId: { type: String },
  preHeader: { type: String },
  footerText: { type: String },
  templateCustomization: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, enum: ['draft', 'processing', 'completed', 'failed'], default: 'draft' },
  totalRecipients: { type: Number, default: 0 },
  sentCount: { type: Number, default: 0 },
  failedCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Campaign = mongoose.model('Campaign', CampaignSchema);

export default Campaign;
