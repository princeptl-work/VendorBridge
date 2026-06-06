const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  module: {
    type: String,
    enum: ['auth', 'vendor', 'rfq', 'quotation', 'approval', 'purchase_order', 'invoice', 'user'],
    required: true
  },
  entityId: mongoose.Schema.Types.ObjectId,
  entityNumber: String,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  performerName: String,
  performerRole: String,
  description: String,
  previousStatus: String,
  newStatus: String,
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

activityLogSchema.index({ module: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
