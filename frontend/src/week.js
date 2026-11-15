function parseIso(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function toIso(date) {
  return date.toISOString().slice(0, 10)
}

export function addDays(iso, days) {
  const date = parseIso(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return toIso(date)
}

export function mondayOf(iso) {
  const sinceMonday = (parseIso(iso).getUTCDay() + 6) % 7
  return addDays(iso, -sinceMonday)
}

export function today() {
  const now = new Date()
  return toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

export function formatDate(iso) {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}
