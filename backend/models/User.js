const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['admin', 'procurement_officer', 'manager', 'vendor'],
    default: 'procurement_officer'
  },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  phone: String,
  department: String,
  company: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  refreshToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  loginOtp: String,
  loginOtpExpire: Date,
  lastLogin: Date
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (pwd) {
  return bcrypt.compare(pwd, this.password);
};

userSchema.methods.generateAuthToken = function () {
  return require('jsonwebtoken').sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

userSchema.methods.generateRefreshToken = function () {
  return require('jsonwebtoken').sign({ id: this._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' });
};

module.exports = mongoose.model('User', userSchema);
