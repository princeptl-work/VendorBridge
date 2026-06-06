const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 10 } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const total = await User.countDocuments(query);
    const users = await User.find(query).select('-password -refreshToken -resetPasswordToken').populate('vendorId', 'name').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, users, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken').populate('vendorId', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, phone, department, isActive, vendorId } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { name, email, role, phone, department, isActive, vendorId: vendorId || undefined }, { new: true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    await ActivityLog.create({ action: 'User Updated', module: 'user', entityId: user._id, performedBy: req.user._id, performerName: req.user.name, performerRole: req.user.role, description: `User '${user.name}' updated`, company: req.user.company });
    res.json({ success: true, user });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) return res.status(400).json({ message: 'Cannot delete your own account' });
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user: { _id: user._id, isActive: user.isActive } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
