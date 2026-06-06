const Invoice = require('../models/Invoice');
const PurchaseOrder = require('../models/PurchaseOrder');
const ActivityLog = require('../models/ActivityLog');
const { generateInvoiceNumber } = require('../utils/generateNumber');
const { sendInvoiceEmail } = require('../utils/emailService');

exports.getInvoices = async (req, res) => {
  try {
    const { status, vendorId, search, page = 1, limit = 10 } = req.query;
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
    if (search) query.invoiceNumber = { $regex: search, $options: 'i' };
    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query).populate('vendorId', 'name email category').populate('poId', 'poNumber').populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, invoices, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getInvoice = async (req, res) => {
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
    const inv = await Invoice.findOne(query).populate('vendorId').populate('poId', 'poNumber deliveryDate paymentTerms deliveryAddress').populate('createdBy', 'name email');
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ success: true, invoice: inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createInvoice = async (req, res) => {
  try {
    const { poId, dueDate, paymentTerms, notes, buyerDetails } = req.body;
    const query = { _id: poId };
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query.vendorId = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const po = await PurchaseOrder.findOne(query).populate('vendorId');
    if (!po) return res.status(404).json({ message: 'PO not found' });
    if (po.invoiceGenerated) return res.status(409).json({ message: 'Invoice already generated for this PO' });
    const invoiceNumber = await generateInvoiceNumber();
    const inv = new Invoice({ invoiceNumber, poId, vendorId: po.vendorId._id, buyerDetails: buyerDetails || { name: po.company || process.env.COMPANY_NAME || 'VendorBridge Corp', email: process.env.COMPANY_EMAIL || '' }, items: po.items, subTotal: po.subTotal, taxRate: po.taxRate, taxAmount: po.taxAmount, grandTotal: po.grandTotal, dueDate: dueDate || new Date(Date.now() + 30*24*60*60*1000), paymentTerms: paymentTerms || po.paymentTerms || 'Net 30', notes, status: 'draft', createdBy: req.user._id, company: po.company });
    await inv.save();
    await PurchaseOrder.findByIdAndUpdate(poId, { invoiceGenerated: true });
    await inv.populate('vendorId', 'name email category');

    let managerEmail = '';
    const Approval = require('../models/Approval');
    const approval = await Approval.findOne({ quotationId: po.quotationId }).populate('timeline.performedBy');
    if (approval) {
      const approvalStep = approval.timeline.find(t => t.action === 'approved');
      if (approvalStep && approvalStep.performedBy) {
        managerEmail = approvalStep.performedBy.email;
      }
    }
    if (!managerEmail) {
      const User = require('../models/User');
      const manager = await User.findOne({ role: 'manager', company: po.company, isActive: true });
      if (manager) managerEmail = manager.email;
    }

    if (managerEmail) {
      await sendInvoiceEmail({
        invoice: inv,
        vendor: inv.vendorId,
        recipientEmail: managerEmail,
        message: `A new invoice has been generated for Purchase Order ${po.poNumber}.`
      });
    }

    await ActivityLog.create({ action: 'Invoice Generated', module: 'invoice', entityId: inv._id, entityNumber: inv.invoiceNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Invoice '${inv.invoiceNumber}' generated from PO '${po.poNumber}' - ₹${inv.grandTotal.toLocaleString()}`, company: po.company });
    res.status(201).json({ success: true, invoice: inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateInvoice = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const inv = await Invoice.findOneAndUpdate(query, req.body, { new: true });
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    res.json({ success: true, invoice: inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.sendInvoice = async (req, res) => {
  try {
    const { recipientEmail, message } = req.body;
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const inv = await Invoice.findOne(query).populate('vendorId');
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    if (!recipientEmail) return res.status(400).json({ message: 'Recipient email required' });
    const result = await sendInvoiceEmail({ invoice: inv, vendor: inv.vendorId, recipientEmail, message });
    inv.status = 'sent'; inv.sentAt = new Date(); inv.sentTo = recipientEmail;
    await inv.save();
    await ActivityLog.create({ action: 'Invoice Sent via Email', module: 'invoice', entityId: inv._id, entityNumber: inv.invoiceNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Invoice '${inv.invoiceNumber}' sent to ${recipientEmail}`, company: inv.company });
    res.json({ success: result.success, message: result.success ? 'Invoice sent successfully' : 'Email failed (check SMTP config)', invoice: inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.markPaid = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const inv = await Invoice.findOne(query);
    if (!inv) return res.status(404).json({ message: 'Invoice not found' });
    inv.status = 'paid'; inv.paidAt = new Date(); inv.paymentReference = paymentReference;
    await inv.save();
    await ActivityLog.create({ action: 'Invoice Marked Paid', module: 'invoice', entityId: inv._id, entityNumber: inv.invoiceNumber, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `Invoice '${inv.invoiceNumber}' marked paid${paymentReference ? ` (Ref: ${paymentReference})` : ''}`, company: inv.company });
    res.json({ success: true, invoice: inv });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
