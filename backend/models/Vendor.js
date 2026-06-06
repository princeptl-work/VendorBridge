const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['IT & Technology', 'Manufacturing', 'Logistics', 'Services', 'Raw Materials', 'Construction', 'Healthcare', 'Food & Beverages', 'Other'],
    required: true
  },
  gstNumber: { type: String, sparse: true, trim: true, uppercase: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, required: true },
  alternatePhone: String,
  address: {
    street: String, city: String, state: String, pincode: String, country: { type: String, default: 'India' }
  },
  bankDetails: {
    accountNumber: String, bankName: String, ifscCode: String, accountHolderName: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'blacklisted', 'pending_verification'],
    default: 'active'
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  totalOrders: { type: Number, default: 0 },
  totalSpend: { type: Number, default: 0 },
  notes: String,
  tags: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Vendor', vendorSchema);
