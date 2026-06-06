const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    total: Number
  }],
  deliveryTimeline: { type: Number, required: true, min: 1 },
  totalAmount: { type: Number, required: true, min: 0 },
  notes: String,
  termsConditions: String,
  validUntil: Date,
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'accepted', 'rejected'],
    default: 'submitted'
  },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  rejectionReason: String,
  company: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Quotation', quotationSchema);
