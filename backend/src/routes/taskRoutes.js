const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requireRole = require('../middleware/requireRole');
const requireChildAccess = require('../middleware/requireChildAccess');
const taskService = require('../services/taskService');

const router = express.Router();

router.use(authMiddleware);

// GET /api/children/:childId/tasks – çocuğun görevleri (FR-M4-02, FR-M4-04)
// Çocuk sadece kendi kaydına erişebildiği için sadece kendi görevlerini görür.
router.get('/:childId/tasks', requireChildAccess, (req, res) => {
  res.json({ tasks: taskService.listTasks(req.child.id) });
});

// POST /api/children/:childId/tasks – görev ata (FR-M4-01, FR-M4-05)
// Veli ve bağlı uzman atayabilir; çocuk → 403.
router.post('/:childId/tasks', requireRole('parent', 'specialist'), requireChildAccess, (req, res) => {
  try {
    const task = taskService.createTask(req.child.id, req.user.id, req.body);
    return res.status(201).json({ task });
  } catch (err) {
    if (err instanceof taskService.TaskError) {
      return res.status(err.status).json({ error: err.message });
    }
    throw err;
  }
});

// PATCH /api/children/:childId/tasks/:taskId/done – görevi tamamla (FR-M4-03)
// Sadece çocuk, sadece kendi görevi.
router.patch(
  '/:childId/tasks/:taskId/done',
  requireRole('child'),
  requireChildAccess,
  (req, res) => {
    const taskId = Number(req.params.taskId);
    const task = Number.isInteger(taskId) ? taskService.markDone(req.child.id, taskId) : null;
    if (!task) {
      return res.status(404).json({ error: 'Görev bulunamadı' });
    }
    return res.json({ task });
  }
);

module.exports = router;
