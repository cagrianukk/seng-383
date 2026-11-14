const linkService = require('../services/linkService');

// /:childId içeren her route'ta authMiddleware'den sonra kullanılır.
// Çocuk yoksa 404, kullanıcının bu çocuğa erişimi yoksa 403 döner (FR-M2-05, NFR-02).
// Başarılıysa çocuğu req.child olarak ekler; M3–M8 route'ları da bunu kullanabilir.
function requireChildAccess(req, res, next) {
  const childId = Number(req.params.childId);
  if (!Number.isInteger(childId)) {
    return res.status(404).json({ error: 'Çocuk bulunamadı' });
  }

  const child = linkService.findChild(childId);
  if (!child) {
    return res.status(404).json({ error: 'Çocuk bulunamadı' });
  }
  if (!linkService.canAccessChild(req.user, child)) {
    return res.status(403).json({ error: 'Bu çocuğa erişim yetkiniz yok' });
  }

  req.child = child;
  next();
}

module.exports = requireChildAccess;
