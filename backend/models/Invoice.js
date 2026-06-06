const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder' },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  buyerDetails: {
    name: { type: String, default: 'VendorBridge Corp' },
    address: String, city: String, state: String, pincode: String,
    gstNumber: String, email: String, phone: String
  },
  items: [{ name: String, description: String, quantity: Number, unitPrice: Number, total: Number }],
  subTotal: { type: Number, required: true },
  taxRate: { type: Number, default: 18 },
  taxAmount: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  dueDate: Date,
  paymentTerms: { type: String, default: 'Net 30' },
  notes: String,
  status: { type: String, enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'], default: 'draft' },
  sentAt: Date,
  sentTo: String,
  paidAt: Date,
  paymentReference: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
