const ActivityLog = require('../models/ActivityLog');

exports.getLogs = async (req, res) => {
  try {
    const { module, search, page = 1, limit = 20 } = req.query;
    let query = {};
    if (req.user.company) query.company = req.user.company;
    if (module && module !== 'all') query.module = module;
    if (search) query.$or = [{ action: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }, { performerName: { $regex: search, $options: 'i' } }, { entityNumber: { $regex: search, $options: 'i' } }];
    const total = await ActivityLog.countDocuments(query);
    const logs = await ActivityLog.find(query).populate('performedBy', 'name email').sort({ createdAt: -1 }).skip((+page-1)*+limit).limit(+limit);
    res.json({ success: true, logs, pagination: { total, page: +page, pages: Math.ceil(total/+limit), limit: +limit } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.getLogStats = async (req, res) => {
  try {
    let match = {};
    if (req.user.company) match.company = req.user.company;
    const stats = await ActivityLog.aggregate([{ $match: match }, { $group: { _id: '$module', count: { $sum: 1 } } }]);
    const query = {};
    if (req.user.company) query.company = req.user.company;
    const recentLogs = await ActivityLog.find(query).sort({ createdAt: -1 }).limit(10).populate('performedBy', 'name');
    res.json({ success: true, stats, recentLogs });
  } catch (e) { res.status(500).json({ message: e.message }); }
};
