import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const PAGE_SIZE = 50

function formatPrice(price) {
  if (price === null || price === undefined) {
    return '—'
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(price))
}

async function getImageUrl(imagePath) {
  if (!imagePath) {
    return ''
  }

  const { data, error } = await supabase.storage
    .from('item-images')
    .createSignedUrl(imagePath, 60 * 60)

  if (error) {
    return ''
  }

  return data.signedUrl
}

function AdminProductsPage() {
  const navigate = useNavigate()

  const [searchInput, setSearchInput] = useState('')
  const [searchText, setSearchText] = useState('')
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setErrorMessage('')

    const { data, error } = await supabase.rpc('get_store_admin_products', {
      search_text: searchText.trim() || null,
      page_limit: PAGE_SIZE,
      page_offset: page * PAGE_SIZE,
    })

    if (error) {
      setErrorMessage(`تعذر تحميل المنتجات: ${error.message}`)
      setLoading(false)
      return
    }

    const productsWithImages = await Promise.all(
      (data ?? []).map(async (product) => {
        const imagePath = product.cover_image_path || product.image_path

        return {
          ...product,
          imageUrl: await getImageUrl(imagePath),
        }
      }),
    )

    setProducts(productsWithImages)
    setTotalCount(Number(data?.[0]?.total_count ?? 0))
    setLoading(false)
  }, [page, searchText])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  function handleSearch(event) {
    event.preventDefault()
    setPage(0)
    setSearchText(searchInput)
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const canGoPrevious = page > 0
  const canGoNext = page + 1 < totalPages

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

        <p className="admin-kicker">إدارة المتجر</p>
        <h1>المنتجات</h1>
        <p>
          ابحث عن أي صنف من قاعدة التسعير، ثم اختر الأصناف التي تريد نشرها في متجر دبوس اونلاين.
        </p>
      </header>

      <section className="admin-search-card">
        <form className="product-search-form" onSubmit={handleSearch}>
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث بكلمات من اسم الصنف بأي ترتيب، مثل: 380v leo"
          />

          <button type="submit" className="admin-primary-button">
            بحث
          </button>

          {searchText ? (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setSearchInput('')
                setSearchText('')
                setPage(0)
              }}
            >
              مسح البحث
            </button>
          ) : null}
        </form>

        <p className="search-helper-text">
          اكتب الكلمات التي تتذكرها من اسم الصنف، حتى لو كان ترتيبها مختلفاً.
        </p>
      </section>

      {errorMessage ? <p className="admin-alert error-alert">{errorMessage}</p> : null}

      <section className="admin-list-card">
        <div className="admin-section-heading">
          <h2>نتائج الأصناف</h2>
          <span className="count-chip">{totalCount}</span>
        </div>

        {loading ? (
          <p className="admin-loading">جارٍ تحميل الأصناف...</p>
        ) : products.length === 0 ? (
          <p className="admin-empty">لم نجد أصنافاً مطابقة للبحث.</p>
        ) : (
          <>
            <div className="admin-products-list">
              {products.map((product) => (
                <article className="admin-product-row" key={product.item_id}>
                  <div className="admin-product-thumb">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span>لا توجد صورة</span>
                    )}
                  </div>

                  <div className="admin-product-main">
                    <div className="admin-product-title-line">
                      <h3>{product.name}</h3>

                      <span
                        className={
                          product.is_published
                            ? 'status-pill active'
                            : 'status-pill hidden'
                        }
                      >
                        {product.is_published ? 'منشور' : 'غير منشور'}
                      </span>
                    </div>

                    <div className="admin-product-meta">
                      <span>السعر الأساسي: {formatPrice(product.base_price)}</span>

                      {product.online_price !== null ? (
                        <span>سعر المتجر: {formatPrice(product.online_price)}</span>
                      ) : null}

                      {product.category_name ? (
                        <span>التصنيف: {product.category_name}</span>
                      ) : null}

                      {product.stock_status ? (
                        <span>
                          المخزون:{' '}
                          {product.stock_status === 'in_stock'
                            ? 'متوفر'
                            : product.stock_status === 'low_stock'
                              ? 'كمية محدودة'
                              : 'غير متوفر'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="admin-product-actions">
                    <button
                      type="button"
                      className="admin-primary-button"
                      onClick={() => navigate(`/admin/products/${product.item_id}`)}
                    >
                      إدارة المنتج
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="pagination-controls">
              <button
                type="button"
                className="secondary-button"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => current - 1)}
              >
                السابق
              </button>

              <span>
                صفحة {page + 1} من {totalPages}
              </span>

              <button
                type="button"
                className="secondary-button"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                التالي
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default AdminProductsPage