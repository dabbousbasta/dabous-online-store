import { Navigate, useLocation } from 'react-router-dom'

function AdminRoute({ authState, children }) {
  const location = useLocation()

  if (authState.loading) {
    return (
      <main className="page-state">
        <p>⏳ جارٍ التحقق من صلاحيات الإدارة...</p>
      </main>
    )
  }

  if (!authState.user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />
  }

  if (authState.role !== 'admin') {
    return <Navigate to="/admin/login" replace state={{ denied: true }} />
  }

  return children
}

export default AdminRoute