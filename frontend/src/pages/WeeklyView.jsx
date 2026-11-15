import { useEffect, useState } from 'react'
import { createEvent, getChildren, getEvents } from '../api'
import EventForm from '../components/EventForm'
import { addDays, formatDate, mondayOf, today } from '../week'

const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']

export default function WeeklyView({ user }) {
  const [children, setChildren] = useState(null)
  const [childId, setChildId] = useState(null)
  const [week, setWeek] = useState(() => mondayOf(today()))
  const [events, setEvents] = useState(null)
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
    setEvents(null)
    getEvents(childId, week)
      .then((list) => {
        if (!ignore) setEvents(list)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [childId, week])

  function handleChildChange(event) {
    setChildId(Number(event.target.value))
    setError('')
  }

  function changeWeek(days) {
    setWeek((current) => addDays(current, days))
    setError('')
  }

  async function handleCreate(event) {
    await createEvent(childId, event)
    const eventWeek = mondayOf(event.startsAt.slice(0, 10))
    if (eventWeek === week) {
      setEvents(await getEvents(childId, week))
    } else {
      setWeek(eventWeek)
    }
  }

  const canEdit = user.role === 'parent' || user.role === 'specialist'

  const days = DAY_NAMES.map((name, index) => {
    const date = addDays(week, index)
    const dayEvents = (events || []).filter((e) => e.startsAt.slice(0, 10) === date)
    return { name, date, events: dayEvents }
  })

  return (
    <section className="card">
      <h1>Takvim</h1>

      {children && children.length === 0 && <p className="muted">Henüz bir çocuk kaydı yok.</p>}

      {children && children.length > 1 && (
        <>
          <label htmlFor="event-child">Çocuk</label>
          <select id="event-child" value={childId ?? ''} onChange={handleChildChange}>
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

      {events === null ? null : events.length === 0 ? (
        <p className="muted">Bu hafta etkinlik yok.</p>
      ) : (
        days.map((day) => (
          <div key={day.date} className="day">
            <h3>
              {day.name} <span className="muted small">{formatDate(day.date)}</span>
            </h3>
            {day.events.length === 0 ? (
              <p className="muted small">—</p>
            ) : (
              <ul className="list" aria-label={day.name}>
                {day.events.map((e) => (
                  <li key={e.id}>
                    <span>
                      <strong>{e.startsAt.slice(11, 16)}</strong> {e.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))
      )}

      {canEdit && childId !== null && (
        <>
          <h2>Etkinlik ekle</h2>
          <EventForm onCreate={handleCreate} />
        </>
      )}
    </section>
  )
}
