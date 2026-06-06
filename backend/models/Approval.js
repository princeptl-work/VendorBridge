const mongoose = require('mongoose');

const approvalSchema = new mongoose.Schema({
  type: { type: String, enum: ['quotation', 'purchase_order'], default: 'quotation' },
  title: { type: String, required: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  amount: Number,
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requesterName: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  remarks: String,
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  dueDate: Date,
  approvedAt: Date,
  rejectedAt: Date,
  timeline: [{
    action: { type: String, enum: ['created', 'approved', 'rejected', 'commented'] },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    performerName: String,
    performerRole: String,
    remarks: String,
    timestamp: { type: Date, default: Date.now }
  }],
  company: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Approval', approvalSchema);
