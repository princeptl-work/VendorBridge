const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');
const Vendor = require('../models/Vendor');
const RFQ = require('../models/RFQ');
const Quotation = require('../models/Quotation');
const Approval = require('../models/Approval');

exports.getOverview = async (req, res) => {
  try {
    const [totalVendors, activeVendors, totalRFQs, activeRFQs, totalPOs, totalInvoices, pendingApprovals, paidInvoices, pendingQuotations] = await Promise.all([
      Vendor.countDocuments(), Vendor.countDocuments({ status: 'active' }),
      RFQ.countDocuments(), RFQ.countDocuments({ status: 'sent' }),
      PurchaseOrder.countDocuments(), Invoice.countDocuments(),
      Approval.countDocuments({ status: 'pending' }),
      Invoice.countDocuments({ status: 'paid' }),
      Quotation.countDocuments({ status: 'submitted' })
    ]);
    const spendAgg = await PurchaseOrder.aggregate([{ $match: { status: { $in: ['confirmed', 'delivered'] } } }, { $group: { _id: null, total: { $sum: '$grandTotal' } } }]);
    const totalSpend = spendAgg[0]?.total || 0;
    res.json({ success: true, stats: { totalVendors, activeVendors, totalRFQs, activeRFQs, totalPOs, totalInvoices, pendingApprovals, paidInvoices, totalSpend, pendingQuotations } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getMonthlySpending = async (req, res) => {
  try {
    const months = 12;
    const startDate = new Date(); startDate.setMonth(startDate.getMonth() - months + 1); startDate.setDate(1); startDate.setHours(0,0,0,0);
    const result = await PurchaseOrder.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: { $in: ['confirmed', 'delivered'] } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, totalSpend: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthlyData = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - months + 1 + i);
      const year = d.getFullYear(), month = d.getMonth() + 1;
      const found = result.find(r => r._id.year === year && r._id.month === month);
      monthlyData.push({ label: d.toLocaleString('default', { month: 'short', year: '2-digit' }), totalSpend: found?.totalSpend || 0, count: found?.count || 0 });
    }
    res.json({ success: true, monthlyData });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getVendorPerformance = async (req, res) => {
  try {
    const vendorStats = await PurchaseOrder.aggregate([
      { $match: { status: { $in: ['confirmed', 'delivered', 'partially_delivered'] } } },
      { $group: { _id: '$vendorId', totalOrders: { $sum: 1 }, totalSpend: { $sum: '$grandTotal' }, deliveredOrders: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } } } },
      { $lookup: { from: 'vendors', localField: '_id', foreignField: '_id', as: 'vendor' } },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      { $project: { vendorName: '$vendor.name', category: '$vendor.category', rating: '$vendor.rating', totalOrders: 1, totalSpend: 1, deliveredOrders: 1, fulfillmentRate: { $multiply: [{ $divide: ['$deliveredOrders', { $max: ['$totalOrders', 1] }] }, 100] } } },
      { $sort: { totalSpend: -1 } }, { $limit: 10 }
    ]);
    res.json({ success: true, vendorStats });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getProcurementStats = async (req, res) => {
  try {
    const [rfqStats, quotationStats, approvalStats, poStats, invoiceStats] = await Promise.all([
      RFQ.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Quotation.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Approval.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      PurchaseOrder.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Invoice.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    const categorySpend = await PurchaseOrder.aggregate([
      { $match: { status: { $in: ['confirmed', 'delivered'] } } },
      { $lookup: { from: 'vendors', localField: 'vendorId', foreignField: '_id', as: 'vendor' } },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$vendor.category', totalSpend: { $sum: '$grandTotal' }, count: { $sum: 1 } } },
      { $sort: { totalSpend: -1 } }
    ]);
    res.json({ success: true, rfqStats, quotationStats, approvalStats, poStats, invoiceStats, categorySpend });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
