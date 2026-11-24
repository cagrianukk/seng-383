export const ROLE_LABELS = {
  parent: 'Veli',
  specialist: 'Uzman',
  child: 'Çocuk',
}

export const SPECIALIST_TYPE_LABELS = {
  teacher: 'Öğretmen',
  psychologist: 'Psikolog',
  doctor: 'Doktor',
  special_education_teacher: 'Özel eğitim öğretmeni',
  coach: 'Antrenör',
}

// Gelişim alanları: backend'deki AREAS ile aynı değerler (FR-M4-01).
export const AREA_LABELS = {
  language: 'Dil',
  social: 'Sosyal',
  motor: 'Motor',
}

export const TASK_STATUS_LABELS = {
  open: 'Açık',
  done: 'Tamamlandı',
}

// Her rol sadece kendi menüsünü görür (FR-M1-03). Yeni sayfalar (M3, M4…) buraya eklenir.
export const NAV_ITEMS = {
  parent: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/specialists', label: 'Uzmanlar' },
    { to: '/tasks', label: 'Görevler' },
    { to: '/schedule', label: 'Takvim' },
    { to: '/stats', label: 'İstatistik' },
  ],
  specialist: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/children', label: 'Çocuklarım' },
    { to: '/tasks', label: 'Görevler' },
    { to: '/schedule', label: 'Takvim' },
    { to: '/stats', label: 'İstatistik' },
  ],
  child: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/my-tasks', label: 'Görevlerim' },
    { to: '/schedule', label: 'Takvim' },
  ],
}
