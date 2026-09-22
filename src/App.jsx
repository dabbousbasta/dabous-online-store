import { useEffect, useState } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { supabase } from './lib/supabase'
import AdminRoute from './components/admin/AdminRoute'
import StorefrontPage from './pages/StorefrontPage'
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'

function App() {
  const [authState, setAuthState] = useState({
    loading: true,
    user: null,
    profile: null,
    role: null,
  })

  useEffect(() => {
    let isActive = true

    async function loadAuthState() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (isActive) {
          setAuthState({
            loading: false,
            user: null,
            profile: null,
            role: null,
          })
        }
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, email, role')
        .eq('id', user.id)
        .maybeSingle()

      if (isActive) {
        setAuthState({
          loading: false,
          user,
          profile: profile ?? null,
          role: profile?.role ?? null,
        })
      }
    }

    loadAuthState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadAuthState()
    })

    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<StorefrontPage />} />

        <Route
          path="/admin/login"
          element={<AdminLoginPage authState={authState} />}
        />

        <Route
          path="/admin"
          element={
            <AdminRoute authState={authState}>
              <AdminDashboardPage authState={authState} />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App