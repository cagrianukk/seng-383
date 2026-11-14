import { describe, test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Layout from './Layout'
import ProtectedRoute from './ProtectedRoute'

function renderAt(path, user, onLogout = () => {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout user={user} onLogout={onLogout} />}>
          <Route index element={<p>Ana sayfa içeriği</p>} />
          <Route
            path="specialists"
            element={
              <ProtectedRoute user={user} roles={['parent']}>
                <p>Uzmanlar sayfası</p>
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

const parent = { id: 1, name: 'Demo Veli', role: 'parent' }
const specialist = { id: 2, name: 'Demo Uzman', role: 'specialist' }
const child = { id: 3, name: 'Demo Çocuk', role: 'child' }

describe('Layout – rol bazlı menü (FR-M1-03)', () => {
  test('veli "Uzmanlar" menüsünü görür', () => {
    renderAt('/', parent)
    expect(screen.getByRole('link', { name: 'Uzmanlar' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Çocuklarım' })).not.toBeInTheDocument()
  })

  test('uzman "Çocuklarım" menüsünü görür, "Uzmanlar"ı görmez', () => {
    renderAt('/', specialist)
    expect(screen.getByRole('link', { name: 'Çocuklarım' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Uzmanlar' })).not.toBeInTheDocument()
  })

  test('çocuk sadece ana sayfa menüsünü görür', () => {
    renderAt('/', child)
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(screen.getByText('Demo Çocuk (Çocuk)')).toBeInTheDocument()
  })

  test('Çıkış butonu onLogout çağırır', () => {
    const onLogout = vi.fn()
    renderAt('/', parent, onLogout)
    fireEvent.click(screen.getByRole('button', { name: 'Çıkış' }))
    expect(onLogout).toHaveBeenCalled()
  })
})

describe('ProtectedRoute', () => {
  test('izinli rol sayfayı görür', () => {
    renderAt('/specialists', parent)
    expect(screen.getByText('Uzmanlar sayfası')).toBeInTheDocument()
  })

  test('izinsiz rol ana sayfaya yönlendirilir', () => {
    renderAt('/specialists', child)
    expect(screen.queryByText('Uzmanlar sayfası')).not.toBeInTheDocument()
    expect(screen.getByText('Ana sayfa içeriği')).toBeInTheDocument()
  })
})
