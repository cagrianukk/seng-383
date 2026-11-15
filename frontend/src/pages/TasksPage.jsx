import { useEffect, useState } from 'react'
import { createTask, getChildren, getTasks } from '../api'
import { AREA_LABELS, TASK_STATUS_LABELS } from '../roles'

const EMPTY_FORM = { title: '', description: '', area: 'language', dueDate: '' }

// '2026-11-20' → '20.11.2026' (saat dilimi kaymasın diye Date kullanmadan çevrilir)
function formatDate(isoDate) {
  const [year, month, day] = isoDate.split('-')
  return `${day}.${month}.${year}`
}

// Veli ve uzman: çocuğa görev atar (FR-M4-01) ve kendi atadığı görevlerin durumunu görür (FR-M4-04).
export default function TasksPage({ user }) {
  const [children, setChildren] = useState(null) // null: henüz yüklenmedi
  const [childId, setChildId] = useState(null)
  const [tasks, setTasks] = useState(null) // null: henüz yüklenmedi
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
    let ignore = false
    getTasks(childId)
      .then((list) => {
        if (!ignore) setTasks(list)
      })
      .catch((err) => {
        if (!ignore) setError(err.message)
      })
    return () => {
      ignore = true
    }
  }, [childId])

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  function handleChildChange(event) {
    setChildId(Number(event.target.value))
    setTasks(null)
    setError('')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await createTask(childId, {
        title: form.title,
        description: form.description,
        area: form.area,
        dueDate: form.dueDate,
      })
      setForm(EMPTY_FORM)
      setNotice('Görev atandı.')
      setTasks(await getTasks(childId))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // FR-M4-04: atayan sadece kendi atadığı görevlerin durumunu görür.
  const myTasks = tasks ? tasks.filter((t) => t.assignedBy === user.id) : []

  return (
    <section className="card">
      <h1>Görevler</h1>

      {children && children.length === 0 && (
        <p className="muted">Henüz görev atayabileceğiniz bir çocuk yok.</p>
      )}

      {children && children.length > 1 && (
        <>
          <label htmlFor="task-child">Çocuk</label>
          <select id="task-child" value={childId ?? ''} onChange={handleChildChange}>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </>
      )}

      <h2>Atadığım görevler</h2>
      {tasks === null ? null : myTasks.length === 0 ? (
        <p className="muted">Henüz görev atamadınız.</p>
      ) : (
        <ul className="list" aria-label="Atadığım görevler">
          {myTasks.map((t) => (
            <li key={t.id}>
              <div>
                <strong>{t.title}</strong>
                {t.description && <div className="muted small">{t.description}</div>}
                <div className="muted small">
                  {AREA_LABELS[t.area] || t.area} · Son tarih: {formatDate(t.dueDate)}
                </div>
              </div>
              <span className={`badge ${t.status}`}>{TASK_STATUS_LABELS[t.status] || t.status}</span>
            </li>
          ))}
        </ul>
      )}

      <h2>Görev ata</h2>
      <form className="form" onSubmit={handleSubmit}>
        <label htmlFor="task-title">Başlık</label>
        <input
          id="task-title"
          type="text"
          value={form.title}
          onChange={updateField('title')}
          maxLength={120}
          required
        />

        <label htmlFor="task-description">Açıklama</label>
        <textarea
          id="task-description"
          value={form.description}
          onChange={updateField('description')}
          maxLength={1000}
          rows={3}
        />

        <label htmlFor="task-area">Gelişim alanı</label>
        <select id="task-area" value={form.area} onChange={updateField('area')}>
          {Object.entries(AREA_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label htmlFor="task-due-date">Son tarih</label>
        <input
          id="task-due-date"
          type="date"
          value={form.dueDate}
          onChange={updateField('dueDate')}
          required
        />

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="success" role="status">
            {notice}
          </p>
        )}

        <button type="submit" disabled={saving || childId === null}>
          {saving ? 'Atanıyor…' : 'Görevi ata'}
        </button>
      </form>
    </section>
  )
}
