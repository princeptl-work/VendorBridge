const crypto = require('crypto');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { sendPasswordResetEmail } = require('../utils/emailService');

const sendResponse = (res, user, statusCode = 200) => {
  const token = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  return { token, refreshToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, vendorId: user.vendorId, isActive: user.isActive } };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, department, vendorId, company } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password required' });
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' });

    let finalVendorId = vendorId;
    if (role === 'vendor') {
      const Vendor = require('../models/Vendor');
      let vendorDoc;
      if (finalVendorId) {
        vendorDoc = await Vendor.findById(finalVendorId);
        if (!vendorDoc) {
          return res.status(400).json({ message: 'The linked vendor profile does not exist.' });
        }
      } else {
        vendorDoc = await Vendor.findOne({ email: email.toLowerCase() });
        if (vendorDoc) {
          finalVendorId = vendorDoc._id;
        }
      }
    }

    const user = new User({ name, email, password, role: role || 'procurement_officer', phone, department, vendorId: finalVendorId || undefined, company: role !== 'vendor' ? company : undefined });
    await user.save();

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({ action: 'User Registered', module: 'auth', entityId: user._id, performedBy: user._id, performerName: user.name, performerRole: user.role, description: `New user '${user.name}' registered`, company: user.company });

    res.status(201).json({ success: true, token, refreshToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, vendorId: user.vendorId, company: user.company, isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    if (!user.isActive) return res.status(401).json({ message: 'Account deactivated. Contact admin.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    await ActivityLog.create({ action: 'User Login', module: 'auth', entityId: user._id, performedBy: user._id, performerName: user.name, performerRole: user.role, description: `User '${user.name}' logged in`, company: user.company });

    res.json({ success: true, token, refreshToken, user: { _id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone, department: user.department, vendorId: user.vendorId, company: user.company, isActive: user.isActive, lastLogin: user.lastLogin } });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken -resetPasswordToken');
    res.json({ success: true, user });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) return res.status(401).json({ message: 'Invalid refresh token' });
    const newToken = user.generateAuthToken();
    const newRefresh = user.generateRefreshToken();
    user.refreshToken = newRefresh;
    await user.save();
    res.json({ success: true, token: newToken, refreshToken: newRefresh });
  } catch { res.status(401).json({ message: 'Invalid or expired refresh token' }); }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await sendPasswordResetEmail({ email: user.email, resetUrl, name: user.name });
    res.json({ success: true, message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: hashedToken, resetPasswordExpire: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    res.json({ success: true, message: 'Password reset successful' });
  } catch { res.status(500).json({ message: 'Server error' }); }
};
