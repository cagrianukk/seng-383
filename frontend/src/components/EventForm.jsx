import { useState } from 'react'

const EMPTY_FORM = { title: '', date: '', time: '' }

export default function EventForm({ onCreate }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setSaving(true)
    try {
      await onCreate({ title: form.title, startsAt: `${form.date}T${form.time}` })
      setForm(EMPTY_FORM)
      setNotice('Etkinlik eklendi.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <label htmlFor="event-title">Başlık</label>
      <input
        id="event-title"
        type="text"
        value={form.title}
        onChange={updateField('title')}
        maxLength={120}
        required
      />

      <label htmlFor="event-date">Tarih</label>
      <input id="event-date" type="date" value={form.date} onChange={updateField('date')} required />

      <label htmlFor="event-time">Saat</label>
      <input id="event-time" type="time" value={form.time} onChange={updateField('time')} required />

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

      <button type="submit" disabled={saving}>
        {saving ? 'Ekleniyor…' : 'Etkinliği ekle'}
      </button>
    </form>
  )
}
