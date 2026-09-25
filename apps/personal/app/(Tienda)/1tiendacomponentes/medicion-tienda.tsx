"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { track } from "@/lib/medicion"

const ES_WHATSAPP = /^(https?:)?\/\/(wa\.me|api\.whatsapp\.com|wa\.link)|^whatsapp:/i

// Mide las vistas de página y los clics de contacto de la Tienda (ver lib/medicion.ts).
// No pinta nada. Los clics se detectan con un solo listener sobre los enlaces
// wa.me, tel: y mailto:, sin tocar cada botón.
export function MedicionTienda() {
  const pathname = usePathname()

  useEffect(() => {
    track("page_viewed")
  }, [pathname])

  useEffect(() => {
    function alHacerClic(e: MouseEvent) {
      const enlace = (e.target as Element | null)?.closest?.("a[href]")
      const href = enlace?.getAttribute("href") ?? ""
      if (ES_WHATSAPP.test(href)) track("contact_clicked", { detalle: "whatsapp" })
      else if (href.startsWith("tel:")) track("contact_clicked", { detalle: "telefono" })
      else if (href.startsWith("mailto:")) track("contact_clicked", { detalle: "correo" })
    }
    document.addEventListener("click", alHacerClic, true)
    return () => document.removeEventListener("click", alHacerClic, true)
  }, [])

  return null
}
