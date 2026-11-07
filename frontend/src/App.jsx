import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import Layout from './components/Layout'
import { login, getMe } from './api'

const TOKEN_KEY = 'token'

export default function App() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return

    getMe(token)
      .then((me) => setUser(me))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setChecking(false))
  }, [])

  async function handleLogin(email, password) {
    const data = await login(email, password)
    localStorage.setItem(TOKEN_KEY, data.token)
    setUser(data.user)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }

  if (checking) {
    return <p className="loading">Yükleniyor…</p>
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<WelcomePage user={user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
