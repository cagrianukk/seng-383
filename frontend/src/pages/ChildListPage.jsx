import { useEffect, useState } from 'react'
import { getChildren } from '../api'
import { SPECIALIST_TYPE_LABELS } from '../roles'

// Uzman: bağlı olduğu çocukların listesi (FR-M2-06)
export default function ChildListPage() {
  const [children, setChildren] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getChildren()
      .then(setChildren)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <section className="card">
      <h1>Çocuklarım</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {children && children.length === 0 && (
        <p className="muted">Henüz size bağlı bir çocuk yok.</p>
      )}
      {children && children.length > 0 && (
        <ul className="list">
          {children.map((c) => (
            <li key={c.id}>
              <strong>{c.name}</strong>
              <span className="muted">
                {SPECIALIST_TYPE_LABELS[c.specialistType] || c.specialistType}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
