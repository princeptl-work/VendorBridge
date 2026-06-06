const mongoose = require('mongoose');

const rfqSchema = new mongoose.Schema({
  rfqNumber: { type: String, unique: true },
  title: { type: String, required: true, trim: true },
  description: String,
  items: [{
    name: { type: String, required: true },
    description: String,
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, default: 'units' },
    estimatedUnitPrice: { type: Number, default: 0 }
  }],
  deadline: { type: Date, required: true },
  vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  attachments: [{ name: String, url: String }],
  status: { type: String, enum: ['draft', 'sent', 'closed', 'cancelled'], default: 'draft' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  selectedQuotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  approvalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  sentAt: Date,
  closedAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('RFQ', rfqSchema);
