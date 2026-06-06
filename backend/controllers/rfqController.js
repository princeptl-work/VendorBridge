const RFQ = require('../models/RFQ');
const ActivityLog = require('../models/ActivityLog');
const { generateRFQNumber } = require('../utils/generateNumber');

const log = (action, rfq, user, desc, extra = {}) =>
  ActivityLog.create({ action, module: 'rfq', entityId: rfq._id, entityNumber: rfq.rfqNumber, performedBy: user._id, performerName: user.name, performerRole: user.role, description: desc, company: user.company, ...extra });

exports.getRFQs = async (req, res) => {
  try {
    const { status, search, priority, page = 1, limit = 10 } = req.query;
    let query = {};
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendors = req.user.vendorId || new mongoose.Types.ObjectId();
      query.status = 'sent';
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { rfqNumber: { $regex: search, $options: 'i' } }];
    const total = await RFQ.countDocuments(query);
    const rfqs = await RFQ.find(query).populate('vendors', 'name email category').populate('createdBy', 'name').populate('selectedQuotationId').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, rfqs, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getRFQ = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendors = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const rfq = await RFQ.findOne(query).populate('vendors', 'name email category phone contactPerson').populate('createdBy', 'name email').populate('selectedQuotationId');
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    res.json({ success: true, rfq });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createRFQ = async (req, res) => {
  try {
    const rfqNumber = await generateRFQNumber();
    const rfq = new RFQ({ ...req.body, rfqNumber, createdBy: req.user._id, company: req.user.company });
    await rfq.save();
    await rfq.populate('vendors', 'name email');
    await log('RFQ Created', rfq, req.user, `RFQ '${rfq.title}' created with ${rfq.items.length} item(s)`);
    res.status(201).json({ success: true, rfq });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateRFQ = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) query.company = req.user.company;
    const rfq = await RFQ.findOne(query);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'draft') return res.status(400).json({ message: 'Only draft RFQs can be edited' });
    Object.assign(rfq, req.body);
    await rfq.save();
    await log('RFQ Updated', rfq, req.user, `RFQ '${rfq.title}' updated`);
    res.json({ success: true, rfq });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteRFQ = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) query.company = req.user.company;
    const rfq = await RFQ.findOne(query);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'draft') return res.status(400).json({ message: 'Only draft RFQs can be deleted' });
    await rfq.deleteOne();
    await log('RFQ Deleted', rfq, req.user, `RFQ '${rfq.title}' deleted`);
    res.json({ success: true, message: 'RFQ deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendRFQ = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) query.company = req.user.company;
    const rfq = await RFQ.findOne(query).populate('vendors', 'name email');
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    if (rfq.status !== 'draft') return res.status(400).json({ message: 'RFQ already sent' });
    if (!rfq.vendors?.length) return res.status(400).json({ message: 'Assign at least one vendor' });
    rfq.status = 'sent'; rfq.sentAt = new Date();
    await rfq.save();
    await log('RFQ Sent', rfq, req.user, `RFQ sent to ${rfq.vendors.length} vendor(s)`, { newStatus: 'sent' });
    res.json({ success: true, rfq, message: 'RFQ sent to vendors' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.closeRFQ = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) query.company = req.user.company;
    const rfq = await RFQ.findOne(query);
    if (!rfq) return res.status(404).json({ message: 'RFQ not found' });
    rfq.status = 'closed'; rfq.closedAt = new Date();
    await rfq.save();
    await log('RFQ Closed', rfq, req.user, `RFQ '${rfq.title}' closed`, { newStatus: 'closed' });
    res.json({ success: true, rfq });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
