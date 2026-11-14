// authMiddleware'den sonra kullanılır: req.user.role izin verilen roller arasında değilse 403 döner (FR-M1-06).
function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'Yetkilendirme gerekli' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
  };
}

module.exports = requireRole;
