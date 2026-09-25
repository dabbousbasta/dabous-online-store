import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CART_STORAGE_KEY = 'dabous-online-store-cart'

const CartContext = createContext(null)

function readSavedCart() {
  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY)

    if (!savedCart) {
      return []
    }

    const parsedCart = JSON.parse(savedCart)

    if (!Array.isArray(parsedCart)) {
      return []
    }

    return parsedCart.filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Number.isFinite(Number(item.price)) &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0,
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readSavedCart)

  useEffect(() => {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function addItem(product) {
    if (!product?.id || !product?.name) {
      return
    }

    const price = Number(product.display_price)

    if (!Number.isFinite(price) || price < 0) {
      return
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        return currentItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        )
      }

      return [
        ...currentItems,
        {
          id: product.id,
          slug: product.slug ?? '',
          name: product.name,
          price,
          quantity: 1,
          imagePath: product.cover_image_path || product.image_path || '',
        },
      ]
    })
  }

  function updateQuantity(itemId, quantity) {
    const normalizedQuantity = Number(quantity)

    if (!Number.isInteger(normalizedQuantity)) {
      return
    }

    setItems((currentItems) => {
      if (normalizedQuantity <= 0) {
        return currentItems.filter((item) => item.id !== itemId)
      }

      return currentItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity: normalizedQuantity }
          : item,
      )
    })
  }

  function removeItem(itemId) {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0,
  )

  const totalPrice = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  )

  const value = useMemo(
    () => ({
      items,
      totalItems,
      totalPrice,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, totalItems, totalPrice],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const cart = useContext(CartContext)

  if (!cart) {
    throw new Error('useCart يجب أن يُستخدم داخل CartProvider')
  }

  return cart
}