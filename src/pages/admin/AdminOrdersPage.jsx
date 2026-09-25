import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(price ?? 0))
}

function formatDate(dateValue) {
  if (!dateValue) {
    return '—'
  }

  return new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(dateValue))
}

function getStatusLabel(status) {
  const labels = {
    new: 'جديد',
    under_review: 'قيد المراجعة',
    contacted_customer: 'تم التواصل مع العميل',
    preparing: 'قيد التجهيز',
    shipped: 'تم الشحن',
    completed: 'مكتمل',
    cancelled: 'ملغي',
  }

  return labels[status] ?? status ?? '—'
}

function getStatusClass(status) {
  const classes = {
    new: 'new',
    under_review: 'under-review',
    contacted_customer: 'contacted-customer',
    preparing: 'preparing',
    shipped: 'shipped',
    completed: 'completed',
    cancelled: 'cancelled',
  }

  return classes[status] ?? 'new'
}

const orderStatusOptions = [
  { value: 'all', label: 'كل الطلبات' },
  { value: 'new', label: 'جديد' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'contacted_customer', label: 'تم التواصل مع العميل' },
  { value: 'preparing', label: 'قيد التجهيز' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغي' },
]

function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadOrders() {
      setLoading(true)
      setErrorMessage('')

      let query = supabase
        .from('store_orders')
        .select(`
          id,
          order_number,
          status,
          customer_name,
          customer_phone,
          total_items,
          total_amount,
          total,
          created_at
        `)
        .order('created_at', { ascending: false })

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data, error } = await query

      if (error) {
        setErrorMessage(`تعذر تحميل الطلبات: ${error.message}`)
        setLoading(false)
        return
      }

      setOrders(data ?? [])
      setLoading(false)
    }

    loadOrders()
  }, [selectedStatus])

  const selectedStatusLabel = orderStatusOptions.find(
    (option) => option.value === selectedStatus,
  )?.label ?? 'كل الطلبات'

  return (
    <main className="admin-page" dir="rtl">
      <header className="admin-page-header">
        <button
          type="button"
          className="text-back-button"
          onClick={() => navigate('/admin')}
        >
          ← العودة إلى لوحة الإدارة
        </button>

        <div>
          <p className="admin-kicker">إدارة الطلبات</p>
          <h1>طلبات العملاء</h1>
          <p>عرض الطلبات المحفوظة من المتجر، مرتبة من الأحدث إلى الأقدم.</p>
        </div>
      </header>

      {errorMessage ? (
        <p className="admin-alert error-alert">{errorMessage}</p>
      ) : null}

      <section className="admin-list-card">
        <div className="admin-orders-toolbar">
          <div>
            <h2>{selectedStatusLabel}</h2>
            <p>اختر حالة لعرض الطلبات المطابقة لها.</p>
          </div>

          <label className="order-filter-field">
            <span>فلترة حسب الحالة</span>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              disabled={loading}
            >
              {orderStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <span className="count-chip">{orders.length}</span>
        </div>

        {loading ? (
          <p className="admin-loading">⏳ جارٍ تحميل الطلبات...</p>
        ) : orders.length === 0 ? (
          <p className="admin-empty">
            لا توجد طلبات بحالة: {selectedStatusLabel}.
          </p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table orders-table">
              <thead>
                <tr>
                  <th>رقم الطلب</th>
                  <th>العميل</th>
                  <th>القطع</th>
                  <th>الإجمالي</th>
                  <th>الحالة</th>
                  <th>تاريخ الطلب</th>
                  <th>التفاصيل</th>
                </tr>
              </thead>

              <tbody>
                {orders.map((order) => {
                  const orderTotal = order.total_amount ?? order.total ?? 0
                  const itemsCount = order.total_items ?? 0

                  return (
                    <tr key={order.id}>
                      <td>
                        <strong>#{order.order_number}</strong>
                      </td>

                      <td>
                        <strong>{order.customer_name}</strong>
                        <small dir="ltr">{order.customer_phone}</small>
                      </td>

                      <td>{itemsCount}</td>

                      <td>
                        <strong>{formatPrice(orderTotal)}</strong>
                      </td>

                      <td>
                        <span className={`order-status-pill ${getStatusClass(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </td>

                      <td>
                        <small>{formatDate(order.created_at)}</small>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="table-edit-button"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          عرض التفاصيل
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminOrdersPage