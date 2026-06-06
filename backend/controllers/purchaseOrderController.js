const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const Vendor = require('../models/Vendor');
const ActivityLog = require('../models/ActivityLog');
const { generatePONumber } = require('../utils/generateNumber');

exports.getPOs = async (req, res) => {
  try {
    const { status, vendorId, search, pendingInvoice, page = 1, limit = 10 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendorId = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
      if (vendorId) query.vendorId = vendorId;
    } else {
      query.company = '___non_existent_company___';
    }
    if (search) query.poNumber = { $regex: search, $options: 'i' };
    if (pendingInvoice === 'true') {
      query.invoiceGenerated = false;
      query.status = { $ne: 'cancelled' };
    }
    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query).populate('vendorId', 'name email category').populate('rfqId', 'rfqNumber title').populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, purchaseOrders: pos, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPO = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendorId = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const po = await PurchaseOrder.findOne(query).populate('vendorId').populate('rfqId', 'rfqNumber title description').populate('quotationId', 'totalAmount deliveryTimeline').populate('createdBy', 'name email');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createPO = async (req, res) => {
  try {
    const { quotationId, rfqId, deliveryDate, deliveryAddress, paymentTerms, terms, notes, taxRate: customTaxRate } = req.body;
    const query = { _id: quotationId };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const quotation = await Quotation.findOne(query).populate('vendorId');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'accepted') return res.status(400).json({ message: 'Quotation must be accepted first' });
    const poNumber = await generatePONumber();
    const taxRate = customTaxRate !== undefined ? customTaxRate : 18;
    const taxAmount = (quotation.totalAmount * taxRate) / 100;
    const grandTotal = quotation.totalAmount + taxAmount;

    const Approval = require('../models/Approval');
    const approval = await Approval.findOne({ quotationId, status: 'approved' });
    const approvalId = approval ? approval._id : undefined;

    const po = new PurchaseOrder({ poNumber, rfqId: rfqId || quotation.rfqId, quotationId, approvalId, vendorId: quotation.vendorId._id, items: quotation.items, subTotal: quotation.totalAmount, taxRate, taxAmount, grandTotal, deliveryDate, deliveryAddress, paymentTerms: paymentTerms || 'Net 30', terms, notes, status: 'confirmed', confirmedAt: new Date(), createdBy: req.user._id, company: req.user.company });
    await po.save();
    await po.populate('vendorId', 'name email category');
    await Vendor.findOneAndUpdate({ _id: quotation.vendorId._id, company: req.user.company }, { $inc: { totalOrders: 1, totalSpend: grandTotal } });
    await ActivityLog.create({ action: 'Purchase Order Generated', module: 'purchase_order', entityId: po._id, entityNumber: po.poNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `PO '${po.poNumber}' generated - Grand Total: ₹${grandTotal.toLocaleString()}`, company: req.user.company });
    res.status(201).json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const query = { _id: req.params.id };
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendorId = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const po = await PurchaseOrder.findOne(query);
    if (!po) return res.status(404).json({ message: 'PO not found' });
    const prev = po.status;
    po.status = status;
    if (notes) po.notes = notes;
    if (status === 'delivered') po.deliveredAt = new Date();
    if (status === 'cancelled') po.cancelledAt = new Date();
    await po.save();
    await ActivityLog.create({ action: 'PO Status Updated', module: 'purchase_order', entityId: po._id, entityNumber: po.poNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `PO '${po.poNumber}' status: '${prev}' → '${status}'`, previousStatus: prev, newStatus: status, company: req.user.company || po.company });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePO = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const po = await PurchaseOrder.findOneAndUpdate(query, req.body, { new: true });
    if (!po) return res.status(404).json({ message: 'PO not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
