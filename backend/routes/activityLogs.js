const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const { getLogs, getLogStats } = require('../controllers/activityLogController');
router.use(protect, authorize('admin', 'manager'));
router.get('/stats', getLogStats);
router.get('/', getLogs);
module.exports = router;
