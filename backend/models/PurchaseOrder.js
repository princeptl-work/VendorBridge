const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, unique: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ' },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation' },
  approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  items: [{
    name: String, description: String, quantity: Number, unitPrice: Number, total: Number
  }],
  subTotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  deliveryDate: Date,
  deliveryAddress: { street: String, city: String, state: String, pincode: String, country: { type: String, default: 'India' } },
  paymentTerms: { type: String, default: 'Net 30' },
  terms: String,
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'partially_delivered', 'delivered', 'cancelled'],
    default: 'confirmed'
  },
  invoiceGenerated: { type: Boolean, default: false },
  confirmedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, trim: true },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);
