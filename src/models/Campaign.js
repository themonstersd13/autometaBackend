import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  emailType: { type: String, enum: ['simple', 'html', 'template'], default: 'simple' },
  templateId: { type: String },
  preHeader: { type: String },
  footerText: { type: String },
  templateCustomization: { type: mongoose.Schema.Types.Mixed },
  status: { type: String, default: 'draft' }, // draft, sending, sent
  createdAt: { type: Date, default: Date.now },
});

const Campaign = mongoose.model('Campaign', CampaignSchema);

export default Campaign;
