import mongoose from 'mongoose';

const RecipientSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  email: { type: String, required: true },
  name: { type: String },
  status: { type: String, default: 'pending' }, // pending, sent, failed
});

const Recipient = mongoose.model('Recipient', RecipientSchema);

export default Recipient;
