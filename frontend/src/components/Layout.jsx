import { NavLink, Outlet } from 'react-router-dom'
import { NAV_ITEMS, ROLE_LABELS } from '../roles'

export default function Layout({ user, onLogout }) {
  const items = NAV_ITEMS[user.role] || []

  return (
    <div className="app">
      <header className="app-header">
        <nav aria-label="Ana menü">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="app-user">
          <span>
            {user.name} ({ROLE_LABELS[user.role] || user.role})
          </span>
          <button type="button" onClick={onLogout}>
            Çıkış
          </button>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}
