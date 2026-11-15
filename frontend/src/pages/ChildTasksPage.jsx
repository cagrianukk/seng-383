import { useEffect, useState } from 'react'
import { getChildren, getTasks, markTaskDone } from '../api'
import { AREA_LABELS } from '../roles'

// 'YYYY-MM-DD' → '16.11.2026'
function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-')
  return `${d}.${m}.${y}`
}

// Açık görevler önce, her grup kendi içinde son tarihe göre.
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'open' ? -1 : 1
    return a.dueDate.localeCompare(b.dueDate)
  })
}

// Çocuk: sadece kendi görevlerini görür (FR-M4-02) ve tamamladığını işaretler (FR-M4-03).
export default function ChildTasksPage() {
  const [childId, setChildId] = useState(null)
  const [tasks, setTasks] = useState(null)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    getChildren()
      .then((children) => {
        if (children.length === 0) {
          setTasks([])
          return
        }
        setChildId(children[0].id)
        return getTasks(children[0].id).then(setTasks)
      })
      .catch((err) => setError(err.message))
  }, [])

  async function handleDone(task) {
    setError('')
    setSavingId(task.id)
    try {
      const updated = await markTaskDone(childId, task.id)
      setTasks((list) => list.map((t) => (t.id === task.id ? { ...t, ...updated } : t)))
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="card">
      <h1>Görevlerim</h1>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {tasks && tasks.length === 0 && <p className="muted">Henüz sana atanmış bir görev yok.</p>}
      {tasks && tasks.length > 0 && (
        <ul className="list" aria-label="Görevler">
          {sortTasks(tasks).map((t) => (
            <li key={t.id} className={t.status === 'done' ? 'task-done' : undefined}>
              <div>
                <strong>{t.title}</strong>
                {t.description && <div className="small">{t.description}</div>}
                <div className="muted small">
                  {AREA_LABELS[t.area] || t.area} · Son tarih: {formatDate(t.dueDate)}
                </div>
              </div>
              {t.status === 'done' ? (
                <span className="badge done">Tamamlandı</span>
              ) : (
                <button type="button" onClick={() => handleDone(t)} disabled={savingId === t.id}>
                  {savingId === t.id ? 'Kaydediliyor…' : 'Tamamladım'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
