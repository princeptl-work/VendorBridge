const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const ActivityLog = require('../models/ActivityLog');

exports.getQuotations = async (req, res) => {
  try {
    const { rfqId, vendorId, status, page = 1, limit = 10 } = req.query;
    let query = {};
    if (rfqId) query.rfqId = rfqId;
    if (status) query.status = status;
    if (req.user.role === 'vendor' && req.user.vendorId) query.vendorId = req.user.vendorId;
    else if (vendorId) query.vendorId = vendorId;
    const total = await Quotation.countDocuments(query);
    const quotations = await Quotation.find(query).populate('rfqId', 'rfqNumber title deadline status').populate('vendorId', 'name email category rating').populate('submittedBy', 'name').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, quotations, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getQuotationsByRFQ = async (req, res) => {
  try {
    const quotations = await Quotation.find({ rfqId: req.params.id }).populate('vendorId', 'name email category rating phone contactPerson').populate('submittedBy', 'name').sort({ totalAmount: 1 });
    res.json({ success: true, quotations });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id).populate('rfqId', 'rfqNumber title items deadline').populate('vendorId', 'name email category rating').populate('submittedBy', 'name email');
    if (!q) return res.status(404).json({ message: 'Quotation not found' });
    res.json({ success: true, quotation: q });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createQuotation = async (req, res) => {
  try {
    const { rfqId, items, deliveryTimeline, notes, termsConditions, validUntil } = req.body;
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'sent') return res.status(400).json({ message: 'RFQ is not open for quotations' });

    let vendorId = req.body.vendorId;
    if (req.user.role === 'vendor' && req.user.vendorId) vendorId = req.user.vendorId;
    if (!vendorId) return res.status(400).json({ message: 'Vendor required' });

    if (await Quotation.findOne({ rfqId, vendorId })) return res.status(409).json({ message: 'You already submitted a quotation for this RFQ' });

    const processedItems = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    const totalAmount = processedItems.reduce((s, i) => s + i.total, 0);

    const q = new Quotation({ rfqId, vendorId, items: processedItems, deliveryTimeline, totalAmount, notes, termsConditions, validUntil, submittedBy: req.user._id });
    await q.save();
    await q.populate('vendorId', 'name email');
    await q.populate('rfqId', 'rfqNumber title');
    await ActivityLog.create({ action: 'Quotation Submitted', module: 'quotation', entityId: q._id, entityNumber: rfq.rfqNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Quotation submitted for RFQ '${rfq.title}' - ₹${totalAmount.toLocaleString()}` });
    res.status(201).json({ success: true, quotation: q });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Quotation not found' });
    if (q.status !== 'submitted') return res.status(400).json({ message: 'Only submitted quotations can be edited' });
    const { items, deliveryTimeline, notes, termsConditions, validUntil } = req.body;
    const processedItems = items.map(i => ({ ...i, total: i.quantity * i.unitPrice }));
    q.items = processedItems;
    q.totalAmount = processedItems.reduce((s, i) => s + i.total, 0);
    q.deliveryTimeline = deliveryTimeline; q.notes = notes; q.termsConditions = termsConditions; q.validUntil = validUntil;
    await q.save();
    res.json({ success: true, quotation: q });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.acceptQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id).populate('rfqId');
    if (!q) return res.status(404).json({ message: 'Quotation not found' });
    await RFQ.findByIdAndUpdate(q.rfqId._id, { selectedQuotationId: q._id });
    q.status = 'under_review'; q.reviewedBy = req.user._id; q.reviewedAt = new Date();
    await q.save();
    await ActivityLog.create({ action: 'Quotation Selected', module: 'quotation', entityId: q._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Quotation selected for review - ₹${q.totalAmount.toLocaleString()}` });
    res.json({ success: true, quotation: q });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.rejectQuotation = async (req, res) => {
  try {
    const q = await Quotation.findById(req.params.id);
    if (!q) return res.status(404).json({ message: 'Quotation not found' });
    q.status = 'rejected'; q.rejectionReason = req.body.reason || 'Rejected'; q.reviewedBy = req.user._id; q.reviewedAt = new Date();
    await q.save();
    await ActivityLog.create({ action: 'Quotation Rejected', module: 'quotation', entityId: q._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Quotation rejected: ${req.body.reason || 'No reason'}` });
    res.json({ success: true, quotation: q });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
