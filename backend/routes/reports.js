const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { getOverview, getMonthlySpending, getVendorPerformance, getProcurementStats } = require('../controllers/reportController');
router.use(protect);
router.get('/overview', getOverview);
router.get('/monthly-spending', getMonthlySpending);
router.get('/vendor-performance', getVendorPerformance);
router.get('/procurement-stats', getProcurementStats);
module.exports = router;
