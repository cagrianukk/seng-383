import { Navigate } from 'react-router-dom'

// Kullanıcının rolü izin verilenler arasında değilse ana sayfaya yönlendirir (FR-M1-03).
// Asıl erişim kontrolü backend'de; bu sadece başka rolün ekranını göstermemek için.
export default function ProtectedRoute({ user, roles, children }) {
  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }
  return children
}
