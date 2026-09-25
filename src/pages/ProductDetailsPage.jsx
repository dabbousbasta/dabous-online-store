import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../context/CartContext'

function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(price))
}

function cleanWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D/g, '')
}

async function getProductImageUrl(imagePath) {
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

function ProductDetailsPage() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [imageUrl, setImageUrl] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [cartMessage, setCartMessage] = useState('')

  useEffect(() => {
    async function loadProduct() {
      setLoading(true)
      setErrorMessage('')
      setCartMessage('')

      const [productResult, settingsResult] = await Promise.all([
        supabase.rpc('get_store_public_product', {
          product_slug: slug,
        }),
        supabase
          .from('store_settings')
          .select('whatsapp_number')
          .limit(1)
          .maybeSingle(),
      ])

      if (productResult.error) {
        setErrorMessage(`تعذر تحميل المنتج: ${productResult.error.message}`)
        setLoading(false)
        return
      }

      const loadedProduct = productResult.data?.[0]

      if (!loadedProduct) {
        setErrorMessage('هذا المنتج غير متوفر أو لم يعد منشوراً.')
        setLoading(false)
        return
      }

      const imagePath = loadedProduct.cover_image_path || loadedProduct.image_path
      const loadedImageUrl = await getProductImageUrl(imagePath)

      setProduct(loadedProduct)
      setImageUrl(loadedImageUrl)
      setWhatsappNumber(cleanWhatsAppNumber(settingsResult.data?.whatsapp_number))
      setLoading(false)
    }

    loadProduct()
  }, [slug])

  function handleAddToCart() {
    if (!product) {
      return
    }

    addItem(product)
    setCartMessage('تمت إضافة المنتج إلى السلة.')
  }

  function handleWhatsAppInquiry() {
    if (!product || !whatsappNumber) {
      return
    }

    const productUrl = `${window.location.origin}${window.location.pathname}#/product/${product.slug}`

    const message = [
      'مرحباً، أريد الاستفسار عن هذا المنتج:',
      '',
      `المنتج: ${product.name}`,
      `السعر: ${formatPrice(product.display_price)}`,
      '',
      `رابط المنتج: ${productUrl}`,
    ].join('\n')

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

    window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
  }

  if (loading) {
    return (
      <main className="page-state">
        <p>⏳ جارٍ تحميل المنتج...</p>
      </main>
    )
  }

  if (errorMessage || !product) {
    return (
      <main className="page-state error-state">
        <h1>تعذر فتح المنتج</h1>
        <p>{errorMessage || 'لم يتم العثور على المنتج.'}</p>
        <button
          type="button"
          className="details-button"
          onClick={() => navigate('/')}
        >
          العودة إلى المتجر
        </button>
      </main>
    )
  }

  const isAvailable = product.stock_status !== 'out_of_stock'
  const specifications = Object.entries(product.specifications ?? {})

  return (
    <div className="store-app" dir="rtl">
      <header className="store-header">
        <div className="brand">
          <div className="brand-mark">د</div>
          <div>
            <h1>دبوس اونلاين</h1>
            <p>من الأساس حتى التشطيب</p>
          </div>
        </div>

        <button
          type="button"
          className="store-back-button"
          onClick={() => navigate('/')}
        >
          ← العودة إلى المتجر
        </button>
      </header>

      <main className="store-content">
        <article className="product-details-card">
          <section className="product-details-image-section">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="product-details-image"
                onError={(event) => {
                  event.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="product-details-placeholder">لا توجد صورة</div>
            )}
          </section>

          <section className="product-details-info">
            {product.category_name ? (
              <p className="product-category">{product.category_name}</p>
            ) : null}

            <h1>{product.name}</h1>

            {product.short_description ? (
              <p className="product-details-short-description">
                {product.short_description}
              </p>
            ) : null}

            <div className="product-details-price-row">
              <strong>{formatPrice(product.display_price)}</strong>

              {product.old_price ? (
                <span className="old-price">
                  {formatPrice(product.old_price)}
                </span>
              ) : null}
            </div>

            <span className={isAvailable ? 'stock available' : 'stock unavailable'}>
              {isAvailable ? 'متوفر حالياً' : 'غير متوفر حالياً'}
            </span>

            {product.description ? (
              <div className="product-details-description">
                <h2>وصف المنتج</h2>
                <p>{product.description}</p>
              </div>
            ) : null}

            {specifications.length > 0 ? (
              <div className="product-details-specifications">
                <h2>المواصفات</h2>

                <dl>
                  {specifications.map(([key, value]) => (
                    <div key={key}>
                      <dt>{key}</dt>
                      <dd>{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}

            {cartMessage ? (
              <p className="cart-success-message">{cartMessage}</p>
            ) : null}

            <div className="product-details-actions">
              <button
                type="button"
                className="details-button product-details-order-button"
                disabled={!isAvailable}
                onClick={handleAddToCart}
              >
                {isAvailable ? 'أضف إلى السلة' : 'غير متوفر حالياً'}
              </button>

              {whatsappNumber ? (
                <button
                  type="button"
                  className="product-whatsapp-button"
                  onClick={handleWhatsAppInquiry}
                >
                  استفسار عبر WhatsApp
                </button>
              ) : null}
            </div>
          </section>
        </article>
      </main>

      <footer className="store-footer">
        جميع الحقوق محفوظة © {new Date().getFullYear()} دبوس اونلاين
      </footer>
    </div>
  )
}

export default ProductDetailsPage