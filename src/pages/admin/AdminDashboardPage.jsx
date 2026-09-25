import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function AdminDashboardPage({ authState }) {
  const navigate = useNavigate()
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleSignOut() {
    setLoggingOut(true)
    await supabase.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="admin-dashboard-page" dir="rtl">
      <header className="admin-dashboard-header">
        <div>
          <p className="admin-kicker">لوحة الإدارة</p>
          <h1>أهلاً {authState.profile?.display_name || 'بك'}</h1>
          <p className="admin-email">{authState.user?.email}</p>
        </div>

        <button
          type="button"
          className="sign-out-button"
          onClick={handleSignOut}
          disabled={loggingOut}
        >
          {loggingOut ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
        </button>
      </header>

      <section className="admin-welcome-card">
        <span className="admin-check">✓</span>
        <div>
          <h2>تم التحقق من صلاحية الإدارة</h2>
          <p>
            هذا الحساب لديه دور <code>admin</code> في جدول profiles، لذلك يمكنه
            الوصول إلى لوحة متجر دبوس اونلاين.
          </p>
        </div>
      </section>

      <section className="admin-next-steps">
        <h2>إدارة المتجر</h2>

        <div className="admin-placeholder-grid">
          <article className="admin-navigation-card">
            <span>المنتجات</span>
            <strong>—</strong>
            <p>ابحث عن الأصناف واختر المنتجات التي تريد عرضها في المتجر.</p>

            <button
              type="button"
              className="card-link-button"
              onClick={() => navigate('/admin/products')}
            >
              إدارة المنتجات
            </button>
          </article>

          <article className="admin-navigation-card">
            <span>التصنيفات</span>
            <strong>—</strong>
            <p>إضافة وتعديل وترتيب وإخفاء تصنيفات المتجر.</p>

            <button
              type="button"
              className="card-link-button"
              onClick={() => navigate('/admin/categories')}
            >
              إدارة التصنيفات
            </button>
          </article>

          <article className="admin-navigation-card">
            <span>الطلبات</span>
            <strong>—</strong>
            <p>عرض طلبات العملاء، تفاصيلها، وتحديث حالة كل طلب.</p>

            <button
              type="button"
              className="card-link-button"
              onClick={() => navigate('/admin/orders')}
            >
              إدارة الطلبات
            </button>
          </article>

          <article>
            <span>مخزون منخفض</span>
            <strong>—</strong>
            <p>تنبيهات الكمية ستظهر لاحقاً.</p>
          </article>
        </div>
      </section>
    </main>
  )
}

export default AdminDashboardPage