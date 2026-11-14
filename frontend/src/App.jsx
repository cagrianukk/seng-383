import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import WelcomePage from './pages/WelcomePage'
import LinkedSpecialistsPage from './pages/LinkedSpecialistsPage'
import ChildListPage from './pages/ChildListPage'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { login, getMe, TOKEN_KEY } from './api'

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
          <Route
            path="specialists"
            element={
              <ProtectedRoute user={user} roles={['parent']}>
                <LinkedSpecialistsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="children"
            element={
              <ProtectedRoute user={user} roles={['specialist']}>
                <ChildListPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
