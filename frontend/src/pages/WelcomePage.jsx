const ROLE_LABELS = {
  parent: 'Veli',
  specialist: 'Uzman',
  child: 'Çocuk',
}

export default function WelcomePage({ user, onLogout }) {
  const roleLabel = ROLE_LABELS[user.role] || user.role

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>
          Hoş geldin, {user.name} ({roleLabel})
        </h1>
        <p className="muted">{user.email}</p>
        <button type="button" onClick={onLogout}>
          Çıkış
        </button>
      </section>
    </main>
  )
}