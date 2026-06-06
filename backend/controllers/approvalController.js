const Approval = require('../models/Approval');
const Quotation = require('../models/Quotation');
const RFQ = require('../models/RFQ');
const ActivityLog = require('../models/ActivityLog');

exports.getApprovals = async (req, res) => {
  try {
    const { status, pendingPO, page = 1, limit = 10 } = req.query;
    let query = {};
    if (status) query.status = status;
    if (req.user.role === 'vendor') {
      return res.json({ success: true, approvals: [], pagination: { total: 0, page: +page, pages: 0, limit: +limit } });
    }
    if (req.user.role === 'procurement_officer') query.requestedBy = req.user._id;
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }

    if (pendingPO === 'true') {
      const PurchaseOrder = require('../models/PurchaseOrder');
      const pos = await PurchaseOrder.find({ company: req.user.company }).select('approvalId');
      const usedApprovalIds = pos.map(p => p.approvalId).filter(Boolean);
      query._id = { $nin: usedApprovalIds };
      query.status = 'approved';
    }

    const total = await Approval.countDocuments(query);
    const approvals = await Approval.find(query).populate('rfqId', 'rfqNumber title').populate('quotationId', 'totalAmount deliveryTimeline items').populate('vendorId', 'name email').populate('requestedBy', 'name email').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, approvals, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getApproval = async (req, res) => {
  try {
    if (req.user.role === 'vendor') {
      return res.status(403).json({ message: 'Forbidden' });
    }
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const a = await Approval.findOne(query).populate('rfqId', 'rfqNumber title description items deadline priority').populate('quotationId', 'totalAmount deliveryTimeline items notes').populate('vendorId', 'name email category rating phone').populate('requestedBy', 'name email role');
    if (!a) return res.status(404).json({ message: 'Approval not found' });
    res.json({ success: true, approval: a });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createApproval = async (req, res) => {
  try {
    const { rfqId, quotationId, vendorId, title, amount, priority, dueDate } = req.body;
    if (await Approval.findOne({ quotationId, status: 'pending', company: req.user.company })) return res.status(409).json({ message: 'Approval request already pending' });
    const a = new Approval({ rfqId, quotationId, vendorId, title, amount, priority: priority || 'medium', dueDate, requestedBy: req.user._id, requesterName: req.user.name, company: req.user.company, timeline: [{ action: 'created', performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, remarks: `Request created by ${req.user.name}` }] });
    await a.save();
    if (rfqId) await RFQ.findOneAndUpdate({ _id: rfqId, company: req.user.company }, { approvalStatus: 'pending' });
    await ActivityLog.create({ action: 'Approval Request Created', module: 'approval', entityId: a._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Approval request for '${title}' - ₹${amount?.toLocaleString() || 'N/A'}`, company: req.user.company });
    res.status(201).json({ success: true, approval: a });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.approveApproval = async (req, res) => {
  try {
    const { remarks } = req.body;
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const a = await Approval.findOne(query);
    if (!a) return res.status(404).json({ message: 'Approval not found' });
    if (a.status !== 'pending') return res.status(400).json({ message: 'Approval is not pending' });
    a.status = 'approved'; a.remarks = remarks; a.approvedAt = new Date();
    a.timeline.push({ action: 'approved', performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, remarks: remarks || 'Approved' });
    await a.save();
    if (a.quotationId) {
      const qQuery = { _id: a.quotationId };
      if (a.company) qQuery.company = a.company;
      else if (req.user.company) qQuery.company = req.user.company;
      await Quotation.findOneAndUpdate(qQuery, { status: 'accepted' });
    }
    if (a.rfqId) {
      const rQuery = { _id: a.rfqId };
      if (a.company) rQuery.company = a.company;
      else if (req.user.company) rQuery.company = req.user.company;
      await RFQ.findOneAndUpdate(rQuery, { approvalStatus: 'approved' });
    }
    await ActivityLog.create({ action: 'Approval Granted', module: 'approval', entityId: a._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Approved by ${req.user.name}${remarks ? ': ' + remarks : ''}`, previousStatus: 'pending', newStatus: 'approved', company: req.user.company });
    res.json({ success: true, approval: a });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.rejectApproval = async (req, res) => {
  try {
    const { remarks } = req.body;
    if (!remarks) return res.status(400).json({ message: 'Rejection remarks required' });
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const a = await Approval.findOne(query);
    if (!a) return res.status(404).json({ message: 'Approval not found' });
    if (a.status !== 'pending') return res.status(400).json({ message: 'Approval is not pending' });
    a.status = 'rejected'; a.remarks = remarks; a.rejectedAt = new Date();
    a.timeline.push({ action: 'rejected', performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, remarks });
    await a.save();
    if (a.quotationId) {
      const qQuery = { _id: a.quotationId };
      if (a.company) qQuery.company = a.company;
      else if (req.user.company) qQuery.company = req.user.company;
      await Quotation.findOneAndUpdate(qQuery, { status: 'rejected', rejectionReason: remarks });
    }
    if (a.rfqId) {
      const rQuery = { _id: a.rfqId };
      if (a.company) rQuery.company = a.company;
      else if (req.user.company) rQuery.company = req.user.company;
      await RFQ.findOneAndUpdate(rQuery, { approvalStatus: 'rejected', selectedQuotationId: null });
    }
    await ActivityLog.create({ action: 'Approval Rejected', module: 'approval', entityId: a._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Rejected by ${req.user.name}: ${remarks}`, previousStatus: 'pending', newStatus: 'rejected', company: req.user.company });
    res.json({ success: true, approval: a });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
