import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  emailType: { type: String, enum: ['simple', 'custom', 'pdf'], default: 'simple' },
  pdfTemplate: { type: Buffer },
  pdfFields: [{
    text: String,
    x: Number,
    y: Number,
    font: String,
    size: Number,
    color: String,
  }],
  status: { type: String, default: 'draft' }, // draft, sending, sent
  createdAt: { type: Date, default: Date.now },
});

const Campaign = mongoose.model('Campaign', CampaignSchema);

export default Campaign;
