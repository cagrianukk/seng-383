const express = require('express');
const authService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre zorunludur' });
  }

  const result = authService.login(email, password);
  if (!result) {
    return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
  }
  return res.status(200).json(result);
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = router;
