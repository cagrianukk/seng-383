import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from './App'

function mockFetch(status, body) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function fillAndSubmit(email, password) {
  fireEvent.change(screen.getByLabelText('E-posta'), { target: { value: email } })
  fireEvent.change(screen.getByLabelText('Şifre'), { target: { value: password } })
  fireEvent.click(screen.getByRole('button', { name: 'Giriş yap' }))
}

const demoUser = { id: 1, name: 'Demo Veli', email: 'parent@example.com', role: 'parent' }

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('401 gelince "E-posta veya şifre hatalı" mesajını gösterir', async () => {
    mockFetch(401, { error: 'Invalid email or password' })
    render(<App />)

    fillAndSubmit('parent@example.com', 'yanlis-sifre')

    expect(await screen.findByRole('alert')).toHaveTextContent('E-posta veya şifre hatalı')
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('başarılı girişte token kaydedilir ve hoş geldin ekranı görünür', async () => {
    const fetchMock = mockFetch(200, { token: 'test-token', user: demoUser })
    render(<App />)

    fillAndSubmit('parent@example.com', 'Parent123!')

    expect(await screen.findByText('Hoş geldin, Demo Veli (Veli)')).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBe('test-token')
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })

  test('Çıkış butonu token\'ı siler ve login sayfasına döner', async () => {
    mockFetch(200, { token: 'test-token', user: demoUser })
    render(<App />)
    fillAndSubmit('parent@example.com', 'Parent123!')

    fireEvent.click(await screen.findByRole('button', { name: 'Çıkış' }))

    expect(screen.getByRole('button', { name: 'Giriş yap' })).toBeInTheDocument()
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('kayıtlı token varsa sayfa açılınca kullanıcıyı /api/auth/me ile getirir', async () => {
    localStorage.setItem('token', 'saved-token')
    const fetchMock = mockFetch(200, { user: demoUser })
    render(<App />)

    expect(await screen.findByText('Hoş geldin, Demo Veli (Veli)')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/me', {
      headers: { Authorization: 'Bearer saved-token' },
    })
  })
})