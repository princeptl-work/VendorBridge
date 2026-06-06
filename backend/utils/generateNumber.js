const RFQ = require('../models/RFQ');
const PurchaseOrder = require('../models/PurchaseOrder');
const Invoice = require('../models/Invoice');

const pad = (n, size) => String(n).padStart(size, '0');
const getYM = () => { const d = new Date(); return `${d.getFullYear()}${pad(d.getMonth()+1,2)}`; };

exports.generateRFQNumber = async () => {
  const count = await RFQ.countDocuments();
  return `RFQ-${getYM()}-${pad(count + 1, 4)}`;
};
exports.generatePONumber = async () => {
  const count = await PurchaseOrder.countDocuments();
  return `PO-${getYM()}-${pad(count + 1, 4)}`;
};
exports.generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  return `INV-${getYM()}-${pad(count + 1, 4)}`;
};
