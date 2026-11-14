export const TOKEN_KEY = 'token'

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const message =
      res.status === 401 ? 'E-posta veya şifre hatalı' : data.error || 'Giriş yapılamadı'
    const error = new Error(message)
    error.status = res.status
    throw error
  }

  return data
}

export async function getMe(token) {
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Oturum geçersiz')
  }

  const data = await res.json()
  return data.user
}

// Token'ı localStorage'dan alıp istek atar; hata olursa backend'in mesajıyla Error fırlatır.
async function authFetch(path, { method = 'GET', body } = {}) {
  const headers = { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const res = await fetch(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || 'İstek başarısız oldu')
    error.status = res.status
    throw error
  }
  return data
}

export async function getChildren() {
  const data = await authFetch('/api/children')
  return data.children
}

export async function getSpecialists(childId) {
  const data = await authFetch(`/api/children/${childId}/specialists`)
  return data.specialists
}

export async function linkSpecialist(childId, email, specialistType) {
  const data = await authFetch(`/api/children/${childId}/specialists`, {
    method: 'POST',
    body: { email, specialistType },
  })
  return data.specialist
}

export async function unlinkSpecialist(childId, specialistId) {
  await authFetch(`/api/children/${childId}/specialists/${specialistId}`, { method: 'DELETE' })
}
