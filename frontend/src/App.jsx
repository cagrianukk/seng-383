import LoginPage from './pages/LoginPage'
import { login } from './api'

export default function App() {
  return <LoginPage onLogin={login} />
}