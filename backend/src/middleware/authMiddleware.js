const authService = require('../services/authService');

// Authorization: Bearer <token> başlığını doğrular, yoksa/geçersizse 401 döner.
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }

  try {
    const payload = authService.verifyToken(token);
    const row = authService.findById(payload.sub);
    if (!row) {
      return res.status(401).json({ error: 'Geçersiz token' });
    }
    req.user = authService.toPublicUser(row);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
}

module.exports = authMiddleware;
