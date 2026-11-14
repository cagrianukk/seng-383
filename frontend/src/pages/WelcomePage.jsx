import { ROLE_LABELS } from '../roles'

export default function WelcomePage({ user }) {
  const roleLabel = ROLE_LABELS[user.role] || user.role

  return (
    <section className="card">
      <h1>
        Hoş geldin, {user.name} ({roleLabel})
      </h1>
      <p className="muted">{user.email}</p>
    </section>
  )
}
