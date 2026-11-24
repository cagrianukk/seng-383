const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const requireChildAccess = require('../middleware/requireChildAccess');
const statsService = require('../services/statsService');
const { EventError } = require('../services/eventService');

const router = express.Router();

router.use(authMiddleware);

// GET /api/children/:childId/stats?week=YYYY-MM-DD – haftalık tamamlanma oranı (FR-M7-01 … FR-M7-03)
// İstatistikleri veli ve bağlı uzman görür (UC8); çocuk → 403.
router.get('/:childId/stats', requireRole('parent', 'specialist'), requireChildAccess, (req, res) => {
  try {
    return res.json(statsService.weeklyStats(req.child.id, req.query.week));
  } catch (err) {
    if (err instanceof EventError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
});

module.exports = router;
