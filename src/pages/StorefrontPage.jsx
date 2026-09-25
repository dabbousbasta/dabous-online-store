import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

const IMAGE_BUCKET = 'item-images'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(price))
}

function normalizeStoragePath(imagePath) {
  const value = String(imagePath ?? '').trim()

  if (!value) {
    return ''
  }

  const bucketPrefix = `${IMAGE_BUCKET}/`

  if (value.startsWith(bucketPrefix)) {
    return value.slice(bucketPrefix.length)
  }

  return value.replace(/^\/+/, '')
}

async function getProductImageUrl(imagePath) {
  const normalizedPath = normalizeStoragePath(imagePath)

  if (!normalizedPath) {
    return ''
  }

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrl(normalizedPath, 60 * 60)

  if (error) {
    console.error('Image signed URL error:', normalizedPath, error.message)
    return ''
  }

  const separator = data.signedUrl.includes('?') ? '&' : '?'

  return `${data.signedUrl}${separator}cacheNonce=${Date.now()}`
}

function ProductImage({ imageUrl, productName }) {
  const [hasImageError, setHasImageError] = useState(false)
  const fallbackImageUrl = `${import.meta.env.BASE_URL}logo.png`

  if (!imageUrl || hasImageError) {
    return (
      <img
        src={fallbackImageUrl}
        alt={`شعار دبوس اونلاين — ${productName}`}
        className="product-image product-image-fallback"
        loading="lazy"
      />
    )
  }

  return (
    <img
      src={imageUrl}
      alt={productName}
      className="product-image"
      loading="lazy"
      onError={() => setHasImageError(true)}
    />
  )
}

function StorefrontPage() {
  const navigate = useNavigate()
  const { totalItems } = useCart()

  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadStorefront() {
      setLoading(true)
      setErrorMessage('')

      const [settingsResult, productsResult] = await Promise.all([
        supabase
          .from('store_settings')
          .select('store_name, store_tagline, whatsapp_number, currency_code, currency_symbol')
          .limit(1)
          .maybeSingle(),
        supabase.rpc('get_store_public_products'),
      ])

      if (settingsResult.error) {
        setErrorMessage(`خطأ في تحميل إعدادات المتجر: ${settingsResult.error.message}`)
        setLoading(false)
        return
      }

      if (productsResult.error) {
        setErrorMessage(`خطأ في تحميل المنتجات: ${productsResult.error.message}`)
        setLoading(false)
        return
      }

      const productsWithImages = await Promise.all(
        (productsResult.data ?? []).map(async (product) => {
          const imagePath = product.cover_image_path || product.image_path

          return {
            ...product,
            imageUrl: await getProductImageUrl(imagePath),
          }
        }),
      )

      setStore(settingsResult.data)
      setProducts(productsWithImages)
      setLoading(false)
    }

    loadStorefront()
  }, [])

  if (loading) {
    return (
      <main className="page-state">
        <p>⏳ جارٍ تحميل متجر دبوس اونلاين...</p>
      </main>
    )
  }

  if (errorMessage) {
    return (
      <main className="page-state error-state">
        <h1>حدث خطأ في تحميل المتجر</h1>
        <p>{errorMessage}</p>
      </main>
    )
  }

  return (
    <div className="store-app" dir="rtl">
      <header className="store-header">
  <button
    type="button"
    className="brand brand-home-button"
    onClick={() => navigate('/')}
    aria-label="الذهاب إلى الصفحة الرئيسية"
    title="الذهاب إلى الصفحة الرئيسية"
  >
    <div className="brand-mark">د</div>

    <div className="brand-text">
      <h1>{store?.store_name ?? 'دبوس اونلاين'}</h1>
      <p>{store?.store_tagline ?? 'من الأساس حتى التشطيب'}</p>
    </div>
  </button>

  <div className="store-header-actions">
    <button
      type="button"
      className="store-cart-button"
      onClick={() => navigate('/cart')}
      aria-label={`سلة المشتريات، فيها ${totalItems} قطعة`}
    >
      <span className="store-cart-icon" aria-hidden="true">🛒</span>
      <span>السلة</span>
      <span className="store-cart-count">{totalItems}</span>
    </button>

    <div className="header-note">
      متجر دبوس اونلاين
    </div>
  </div>
</header>

      <main className="store-content">
        <section className="intro-section">
          <span className="eyebrow">منتجات مختارة</span>
          <h2>منتجات دبوس اونلاين</h2>
          <p>تصفح المنتجات المنشورة والمتاحة حالياً.</p>
        </section>

        {products.length === 0 ? (
          <section className="empty-state">
            <h2>لا توجد منتجات منشورة حالياً</h2>
            <p>ستظهر المنتجات هنا فور نشرها من لوحة الإدارة.</p>
          </section>
        ) : (
          <section className="products-grid">
            {products.map((product) => {
              const isAvailable = product.stock_status !== 'out_of_stock'

              return (
                <article className="product-card" key={product.id}>
                  <div className="product-image-wrap">
                    {product.discount_percent ? (
                      <span className="discount-badge">
                        خصم {product.discount_percent}%
                      </span>
                    ) : null}

                    <ProductImage
                      imageUrl={product.imageUrl}
                      productName={product.name}
                    />
                  </div>

                  <div className="product-content">
                    {product.category_name ? (
                      <p className="product-category">{product.category_name}</p>
                    ) : null}

                    <h3>{product.name}</h3>

                    {product.short_description ? (
                      <p className="product-description">
                        {product.short_description}
                      </p>
                    ) : null}

                    <div className="price-row">
                      <strong>{formatPrice(product.display_price)}</strong>

                      {product.old_price ? (
                        <span className="old-price">
                          {formatPrice(product.old_price)}
                        </span>
                      ) : null}
                    </div>

                    <div className="product-footer">
                      <span className={isAvailable ? 'stock available' : 'stock unavailable'}>
                        {isAvailable ? 'متوفر' : 'غير متوفر'}
                      </span>

                      <button
                        type="button"
                        className="details-button"
                        onClick={() => navigate(`/product/${product.slug}`)}
                      >
                        عرض التفاصيل
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </section>
        )}
      </main>

      <footer className="store-footer">
        جميع الحقوق محفوظة © {new Date().getFullYear()} {store?.store_name ?? 'دبوس اونلاين'}
      </footer>
    </div>
  )
}

export default StorefrontPage