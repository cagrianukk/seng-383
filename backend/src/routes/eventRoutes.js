const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const requireChildAccess = require('../middleware/requireChildAccess');
const eventService = require('../services/eventService');

const router = express.Router();

router.use(authMiddleware);

function sendEventError(err, res) {
  if (err instanceof eventService.EventError) {
    return res.status(err.status).json({ error: err.message });
  }
  throw err;
}

router.get('/:childId/events', requireChildAccess, (req, res) => {
  try {
    return res.json(eventService.listEvents(req.child.id, req.query.week));
  } catch (err) {
    return sendEventError(err, res);
  }
});

router.post('/:childId/events', requireRole('parent', 'specialist'), requireChildAccess, (req, res) => {
  try {
    const event = eventService.createEvent(req.child.id, req.user.id, req.body);
    return res.status(201).json({ event });
  } catch (err) {
    return sendEventError(err, res);
  }
});

module.exports = router;
