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