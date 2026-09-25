import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function cleanWhatsAppNumber(value) {
  return String(value ?? '').replace(/\D/g, '')
}

function WhatsAppContactButton() {
  const [whatsappNumber, setWhatsappNumber] = useState('')

  useEffect(() => {
    async function loadWhatsAppNumber() {
      const { data, error } = await supabase
        .from('store_settings')
        .select('whatsapp_number')
        .limit(1)
        .maybeSingle()

      if (error) {
        return
      }

      setWhatsappNumber(cleanWhatsAppNumber(data?.whatsapp_number))
    }

    loadWhatsAppNumber()
  }, [])

  if (!whatsappNumber) {
    return null
  }

  const message = 'مرحباً، أريد الاستفسار عن منتجات متجر دبوس اونلاين.'
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`

  return (
    <a
      className="whatsapp-contact-button"
      href={whatsappUrl}
      target="_blank"
      rel="noreferrer"
      aria-label="تواصل معنا عبر WhatsApp"
      title="تواصل معنا عبر WhatsApp"
    >
      <span aria-hidden="true">☎</span>
      <span>WhatsApp</span>
    </a>
  )
}

export default WhatsAppContactButton