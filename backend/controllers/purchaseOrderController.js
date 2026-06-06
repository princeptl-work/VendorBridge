const PurchaseOrder = require('../models/PurchaseOrder');
const Quotation = require('../models/Quotation');
const Vendor = require('../models/Vendor');
const ActivityLog = require('../models/ActivityLog');
const { generatePONumber } = require('../utils/generateNumber');

exports.getPOs = async (req, res) => {
  try {
    const { status, vendorId, search, page = 1, limit = 10 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (req.user.role === 'vendor' && req.user.vendorId) query.vendorId = req.user.vendorId;
    else if (vendorId) query.vendorId = vendorId;
    if (search) query.poNumber = { $regex: search, $options: 'i' };
    const total = await PurchaseOrder.countDocuments(query);
    const pos = await PurchaseOrder.find(query).populate('vendorId', 'name email category').populate('rfqId', 'rfqNumber title').populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, purchaseOrders: pos, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getPO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findById(req.params.id).populate('vendorId').populate('rfqId', 'rfqNumber title description').populate('quotationId', 'totalAmount deliveryTimeline').populate('createdBy', 'name email');
    if (!po) return res.status(404).json({ message: 'Purchase Order not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createPO = async (req, res) => {
  try {
    const { quotationId, rfqId, deliveryDate, deliveryAddress, paymentTerms, terms, notes, taxRate: customTaxRate } = req.body;
    const quotation = await Quotation.findById(quotationId).populate('vendorId');
    if (!quotation) return res.status(404).json({ message: 'Quotation not found' });
    if (quotation.status !== 'accepted') return res.status(400).json({ message: 'Quotation must be accepted first' });
    const poNumber = await generatePONumber();
    const taxRate = customTaxRate !== undefined ? customTaxRate : 18;
    const taxAmount = (quotation.totalAmount * taxRate) / 100;
    const grandTotal = quotation.totalAmount + taxAmount;
    const po = new PurchaseOrder({ poNumber, rfqId: rfqId || quotation.rfqId, quotationId, vendorId: quotation.vendorId._id, items: quotation.items, subTotal: quotation.totalAmount, taxRate, taxAmount, grandTotal, deliveryDate, deliveryAddress, paymentTerms: paymentTerms || 'Net 30', terms, notes, status: 'confirmed', confirmedAt: new Date(), createdBy: req.user._id });
    await po.save();
    await po.populate('vendorId', 'name email category');
    await Vendor.findByIdAndUpdate(quotation.vendorId._id, { $inc: { totalOrders: 1, totalSpend: grandTotal } });
    await ActivityLog.create({ action: 'Purchase Order Generated', module: 'purchase_order', entityId: po._id, entityNumber: po.poNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `PO '${po.poNumber}' generated - Grand Total: ₹${grandTotal.toLocaleString()}` });
    res.status(201).json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePOStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const po = await PurchaseOrder.findById(req.params.id);
    if (!po) return res.status(404).json({ message: 'PO not found' });
    const prev = po.status;
    po.status = status;
    if (notes) po.notes = notes;
    if (status === 'delivered') po.deliveredAt = new Date();
    if (status === 'cancelled') po.cancelledAt = new Date();
    await po.save();
    await ActivityLog.create({ action: 'PO Status Updated', module: 'purchase_order', entityId: po._id, entityNumber: po.poNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `PO '${po.poNumber}' status: '${prev}' → '${status}'`, previousStatus: prev, newStatus: status });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updatePO = async (req, res) => {
  try {
    const po = await PurchaseOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!po) return res.status(404).json({ message: 'PO not found' });
    res.json({ success: true, purchaseOrder: po });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
