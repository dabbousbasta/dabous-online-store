import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function AdminLoginPage({ authState }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(
    location.state?.denied
      ? 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة الإدارة.'
      : '',
  )

  if (!authState.loading && authState.user && authState.role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setMessage('تعذر تسجيل الدخول. تأكد من البريد الإلكتروني وكلمة المرور.')
      setLoading(false)
      return
    }

    const from = location.state?.from?.pathname || '/admin'
    navigate(from, { replace: true })
  }

  return (
    <main className="admin-login-page" dir="rtl">
      <section className="admin-login-card">
        <div className="admin-login-brand">
          <span>د</span>
          <div>
            <h1>دبوس اونلاين</h1>
            <p>تسجيل دخول الإدارة</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label htmlFor="admin-email">
            البريد الإلكتروني
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />

          <label htmlFor="admin-password">
            كلمة المرور
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="أدخل كلمة المرور"
            autoComplete="current-password"
            required
          />

          {message ? <p className="form-message error-message">{message}</p> : null}

          <button type="submit" className="admin-login-button" disabled={loading}>
            {loading ? 'جارٍ تسجيل الدخول...' : 'دخول إلى لوحة الإدارة'}
          </button>
        </form>

        <button
          type="button"
          className="back-to-store-button"
          onClick={() => navigate('/')}
        >
          العودة إلى المتجر
        </button>
      </section>
    </main>
  )
}

export default AdminLoginPage