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

// Her rol sadece kendi menüsünü görür (FR-M1-03). Yeni sayfalar (M3, M4…) buraya eklenir.
export const NAV_ITEMS = {
  parent: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/specialists', label: 'Uzmanlar' },
  ],
  specialist: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/children', label: 'Çocuklarım' },
  ],
  child: [
    { to: '/', label: 'Ana sayfa' },
    { to: '/tasks', label: 'Görevlerim' },
  ],
}

// Görevlerin gelişim alanları (FR-M4-01, FR-M7-02). Seed verisi de bu anahtarları kullanır.
export const AREA_LABELS = {
  language: 'Dil',
  social: 'Sosyal',
  motor: 'Motor',
  cognitive: 'Bilişsel',
}
