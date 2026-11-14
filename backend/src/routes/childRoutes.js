const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const requireChildAccess = require('../middleware/requireChildAccess');
const linkService = require('../services/linkService');

const router = express.Router();

router.use(authMiddleware);

// GET /api/children – kullanıcının görebildiği çocuklar
router.get('/', (req, res) => {
  res.json({ children: linkService.listChildrenFor(req.user) });
});

// GET /api/children/:childId/specialists – bağlı uzmanlar (FR-M2-03)
router.get(
  '/:childId/specialists',
  requireRole('parent', 'specialist'),
  requireChildAccess,
  (req, res) => {
    res.json({ specialists: linkService.listSpecialists(req.child.id) });
  }
);

// POST /api/children/:childId/specialists – uzman bağla (FR-M2-01, FR-M2-02)
router.post('/:childId/specialists', requireRole('parent'), requireChildAccess, (req, res) => {
  const { email, specialistType } = req.body || {};
  if (typeof email !== 'string' || !email.trim() || typeof specialistType !== 'string') {
    return res.status(400).json({ error: 'E-posta ve uzman türü zorunludur' });
  }

  try {
    const specialist = linkService.linkSpecialist(req.child.id, email, specialistType);
    return res.status(201).json({ specialist });
  } catch (err) {
    if (err instanceof linkService.LinkError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
});

// DELETE /api/children/:childId/specialists/:specialistId – bağı kaldır (FR-M2-04)
router.delete(
  '/:childId/specialists/:specialistId',
  requireRole('parent'),
  requireChildAccess,
  (req, res) => {
    const removed = linkService.unlinkSpecialist(req.child.id, Number(req.params.specialistId));
    if (!removed) {
      return res.status(404).json({ error: 'Bu uzman bu çocuğa bağlı değil' });
    }
    return res.status(204).end();
  }
);

module.exports = router;
