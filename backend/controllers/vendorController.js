const Vendor = require('../models/Vendor');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

const log = (action, vendor, user, desc) => ActivityLog.create({ action, module: 'vendor', entityId: vendor._id, entityNumber: vendor.name, performedBy: user._id, performerName: user.name, performerRole: user.role, description: desc, company: user.company });

exports.getVendors = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;
    let query = {};
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query._id = req.user.vendorId || new mongoose.Types.ObjectId();
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
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
    const query = { _id: req.params.id };
    if (req.user.role === 'vendor') {
      const mongoose = require('mongoose');
      query._id = req.user.vendorId || new mongoose.Types.ObjectId();
      if (req.params.id !== req.user.vendorId?.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } else if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const vendor = await Vendor.findOne(query).populate('createdBy', 'name');
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.createVendor = async (req, res) => {
  try {
    if (req.body.email) {
      const emailLower = req.body.email.toLowerCase();
      // Check if User account exists
      const userExists = await User.findOne({ email: emailLower });
      if (!userExists) {
        return res.status(400).json({ message: 'No user account found with this email. The vendor must sign up or create an account first.' });
      }

      // Check if Vendor profile already exists in company
      const existing = await Vendor.findOne({ email: emailLower, company: req.user.company });
      if (existing) {
        return res.status(400).json({ message: 'A vendor with this email is already registered.' });
      }
    }
    const vendor = new Vendor({ ...req.body, createdBy: req.user._id, company: req.user.company });
    await vendor.save();
    
    // Automatically link the User account to the newly created Vendor profile
    if (req.body.email) {
      await User.findOneAndUpdate({ email: req.body.email.toLowerCase() }, { vendorId: vendor._id });
    }

    await log('Vendor Created', vendor, req.user, `Vendor '${vendor.name}' created`);
    res.status(201).json({ success: true, vendor });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'GST number already exists' });
    res.status(500).json({ message: e.message });
  }
};

exports.updateVendor = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const vendor = await Vendor.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Updated', vendor, req.user, `Vendor '${vendor.name}' updated`);
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteVendor = async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const vendor = await Vendor.findOneAndDelete(query);
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Deleted', vendor, req.user, `Vendor '${vendor.name}' deleted`);
    res.json({ success: true, message: 'Vendor deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateVendorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const query = { _id: req.params.id };
    if (req.user.company) {
      query.company = req.user.company;
    } else {
      query.company = '___non_existent_company___';
    }
    const vendor = await Vendor.findOneAndUpdate(query, { status }, { new: true });
    if (!vendor) return res.status(404).json({ message: 'Vendor not found' });
    await log('Vendor Status Updated', vendor, req.user, `Vendor '${vendor.name}' status → '${status}'`);
    res.json({ success: true, vendor });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
