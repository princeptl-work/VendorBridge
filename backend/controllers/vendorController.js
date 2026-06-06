const Vendor = require('../models/Vendor');
const ActivityLog = require('../models/ActivityLog');

const log = (action, vendor, user, desc) => ActivityLog.create({ action, module: 'vendor', entityId: vendor._id, entityNumber: vendor.name, performedBy: user._id, performerName: user.name, performerRole: user.role, description: desc });

exports.getVendors = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    let query = {};
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }, { contactPerson: { $regex: search, $options: 'i' } }, { gstNumber: { $regex: search, $options: 'i' } }];
    if (status) query.status = status;
    if (category) query.category = category;
    const total = await Vendor.countDocuments(query);
    const vendors = await Vendor.find(query).populate('createdBy', 'name').sort({ createdAt: -1 }).skip((+page - 1) * +limit).limit(+limit);
    res.json({ success: true, vendors, pagination: { total, page: +page, pages: Math.ceil(total / +limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('createdBy', 'name');
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createVendor = async (req, res) => {
  try {
    const vendor = new Vendor({ ...req.body, createdBy: req.user._id });
    await vendor.save();
    await log('Vendor Created', vendor, req.user, `Vendor '${vendor.name}' created`);
    res.status(201).json({ success: true, vendor });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'GST number already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Updated', vendor, req.user, `Vendor '${vendor.name}' updated`);
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Deleted', vendor, req.user, `Vendor '${vendor.name}' deleted`);
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const vendor = await Vendor.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Status Updated', vendor, req.user, `Vendor '${vendor.name}' status → '${status}'`);
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
