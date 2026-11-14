import { useEffect, useState } from 'react'
import { getChildren, getSpecialists, linkSpecialist, unlinkSpecialist } from '../api'
import { SPECIALIST_TYPE_LABELS } from '../roles'

// Veli: çocuğa bağlı uzmanları listeler, e-postayla uzman bağlar ve onay alarak bağı kaldırır (M2).
export default function LinkedSpecialistsPage() {
  const [children, setChildren] = useState([])
  const [childId, setChildId] = useState(null)
  const [specialists, setSpecialists] = useState([])
  const [email, setEmail] = useState('')
  const [specialistType, setSpecialistType] = useState('teacher')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getChildren()
      .then((list) => {
        setChildren(list)
        if (list.length > 0) setChildId(list[0].id)
      })
      .catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    if (childId === null) return
    getSpecialists(childId)
      .then(setSpecialists)
      .catch((err) => setError(err.message))
  }, [childId])

  async function loadSpecialists(id) {
    setSpecialists(await getSpecialists(id))
  }

  async function handleLink(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      await linkSpecialist(childId, email, specialistType)
      setEmail('')
      await loadSpecialists(childId)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUnlink(specialist) {
    // FR-M2-04: bağ kaldırmadan önce onay adımı
    if (!window.confirm(`${specialist.name} adlı uzmanın bağı kaldırılsın mı?`)) return
    setError('')
    try {
      await unlinkSpecialist(childId, specialist.id)
      await loadSpecialists(childId)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="card">
      <h1>Bağlı uzmanlar</h1>

      {children.length > 1 && (
        <>
          <label htmlFor="child">Çocuk</label>
          <select id="child" value={childId ?? ''} onChange={(e) => setChildId(Number(e.target.value))}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      )}

      {specialists.length === 0 ? (
        <p className="muted">Henüz bağlı uzman yok.</p>
      ) : (
        <ul className="list">
          {specialists.map((s) => (
            <li key={s.id}>
              <div>
                <strong>{s.name}</strong> – {SPECIALIST_TYPE_LABELS[s.specialistType] || s.specialistType}
                <div className="muted small">{s.email}</div>
              </div>
              <button type="button" className="secondary" onClick={() => handleUnlink(s)}>
                Bağı kaldır
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Uzman bağla</h2>
      <form className="form" onSubmit={handleLink}>
        <label htmlFor="specialist-email">Uzmanın e-postası</label>
        <input
          id="specialist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="specialist-type">Uzman türü</label>
        <select
          id="specialist-type"
          value={specialistType}
          onChange={(e) => setSpecialistType(e.target.value)}
        >
          {Object.entries(SPECIALIST_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={saving || childId === null}>
          {saving ? 'Bağlanıyor…' : 'Bağla'}
        </button>
      </form>
    </section>
  )
}
