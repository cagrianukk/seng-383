import { useEffect, useState } from 'react'
import { getChildren, getStats } from '../api'
import { AREA_LABELS } from '../roles'
import { addDays, formatDate, mondayOf, today } from '../week'

function RateBar({ label, assigned, done, rate }) {
  return (
    <div className="rate-row">
      <div className="rate-head">
        <span>{label}</span>
        <span className="muted small">
          {done} / {assigned} · %{rate}
        </span>
      </div>
      <div
        className="rate-bar"
        role="progressbar"
        aria-label={label}
        aria-valuenow={rate}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="rate-fill" style={{ width: `${rate}%` }} />
      </div>
    </div>
  )
}

// Veli ve uzman: seçilen haftanın görev tamamlanma oranı, toplam ve gelişim alanına göre (FR-M7-01 … FR-M7-03).
export default function StatsPanel() {
  const [children, setChildren] = useState(null)
  const [childId, setChildId] = useState(null)
  const [week, setWeek] = useState(() => mondayOf(today()))
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

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
    let ignore = false
    getStats(childId, week)
      .then((data) => {
        if (!ignore) setStats(data)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [childId, week])

  function changeWeek(days) {
    setWeek((current) => addDays(current, days))
    setStats(null)
    setError('')
  }

  function handleChildChange(event) {
    setChildId(Number(event.target.value))
    setStats(null)
    setError('')
  }

  return (
    <section className="card">
      <h1>Haftalık istatistik</h1>

      {children && children.length === 0 && <p className="muted">Henüz bir çocuk kaydı yok.</p>}

      {children && children.length > 1 && (
        <>
          <label htmlFor="stats-child">Çocuk</label>
          <select id="stats-child" value={childId ?? ''} onChange={handleChildChange}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      )}

      <div className="week-nav">
        <button type="button" className="secondary" onClick={() => changeWeek(-7)}>
          ← Önceki hafta
        </button>
        <strong>
          {formatDate(week)} – {formatDate(addDays(week, 6))}
        </strong>
        <button type="button" className="secondary" onClick={() => changeWeek(7)}>
          Sonraki hafta →
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {stats && stats.total.assigned === 0 && (
        <p className="muted">Bu hafta için görev yok (0 görev).</p>
      )}

      {stats && stats.total.assigned > 0 && (
        <>
          <p className="stats-total">
            Tamamlanma oranı: <strong>%{stats.total.rate}</strong>{' '}
            <span className="muted">
              ({stats.total.done} / {stats.total.assigned} görev)
            </span>
          </p>
          <h2>Gelişim alanına göre</h2>
          {stats.byArea.map((a) => (
            <RateBar
              key={a.area}
              label={AREA_LABELS[a.area] || a.area}
              assigned={a.assigned}
              done={a.done}
              rate={a.rate}
            />
          ))}
        </>
      )}
    </section>
  )
}
