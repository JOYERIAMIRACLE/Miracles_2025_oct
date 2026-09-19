"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Panel = "instagram" | "facebook" | "whatsapp" | "telefono" | "correo" | "ubicacion" | null

// Placeholders hasta tener los datos/cuentas reales — mismo criterio que ya
// usaba este archivo (tel:+521XXXXXXXXXX) y footer.tsx (contacto@medalladeoro.com.mx):
// visibles, fáciles de encontrar y reemplazar en un solo lugar en cuanto
// exista el enlace real de cada red.
const TELEFONO      = "+52 1 XX XXXX XXXX"
const TELEFONO_HREF = "tel:+521XXXXXXXXXX"
const CORREO        = "contacto@medalladeoro.com.mx"
const DIRECCION     = "Av. Insurgentes Sur 1602, Col. Crédito Constructor, CDMX"
const MAPS_QUERY    = "Medalla+de+Oro+Joyer%C3%ADa"
const MAPS_HREF     = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`
const MAPS_EMBED    = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`
const INSTAGRAM_HANDLE = "@medalladeoro.joyeria"
const INSTAGRAM_HREF   = "https://instagram.com/medalladeoro.joyeria"
const FACEBOOK_NAME    = "Medalla de Oro Joyería"
const FACEBOOK_HREF    = "https://facebook.com/medalladeoro.joyeria"
const WHATSAPP_NUMERO  = "+52 1 XX XXXX XXXX"
const WHATSAPP_HREF    = "https://wa.me/521XXXXXXXXXX"

// Reset de botón explícito: los <button> (Teléfono/Correo/Ver ubicación)
// traen padding/borde por default del navegador que los <a> no tienen.
const triggerCls = "bg-transparent border-0 appearance-none p-0 m-0 cursor-pointer text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
// Cada item (sea <a> o <button>) va envuelto en un contenedor idéntico de
// alto fijo — sin esto, un <a> (inline) y un <button> (con sus propias
// métricas de fuente/line-height por default del navegador) no miden
// exactamente lo mismo y el renglón se ve descuadrado entre ambos tipos.
const itemWrapCls = "relative flex items-center h-4"
// w-72 (no w-56): a ese ancho el correo completo ("contacto@medalladeoro.com.mx"
// en text-sm font-semibold) se partía a una segunda línea dentro del panel.
const panelCls     = "absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-72 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-4 backdrop-blur-sm"

export default function ContactoRapido() {
  const [open, setOpen] = useState<Panel>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggle = (p: Exclude<Panel, null>) => setOpen(o => (o === p ? null : p))

  return (
    <div ref={ref} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4">
      {/* Instagram */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("instagram")} className={triggerCls}>
          Instagram
        </button>
        {open === "instagram" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Síguenos en Instagram</p>
            <p className="text-white text-sm font-semibold mb-3">{INSTAGRAM_HANDLE}</p>
            <a
              href={INSTAGRAM_HREF}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Abrir Instagram
            </a>
          </div>
        )}
      </div>

      {/* Facebook */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("facebook")} className={triggerCls}>
          Facebook
        </button>
        {open === "facebook" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Síguenos en Facebook</p>
            <p className="text-white text-sm font-semibold mb-3">{FACEBOOK_NAME}</p>
            <a
              href={FACEBOOK_HREF}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Abrir Facebook
            </a>
          </div>
        )}
      </div>

      {/* WhatsApp */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("whatsapp")} className={triggerCls}>
          WhatsApp
        </button>
        {open === "whatsapp" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Escríbenos por WhatsApp</p>
            <p className="text-white text-sm font-semibold mb-3">{WHATSAPP_NUMERO}</p>
            <a
              href={WHATSAPP_HREF}
              target="_blank" rel="noopener noreferrer"
              className="block w-full text-center py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Abrir WhatsApp
            </a>
          </div>
        )}
      </div>

      {/* Teléfono */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("telefono")} className={triggerCls}>
          Teléfono
        </button>
        {open === "telefono" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Llámanos al</p>
            <p className="text-white text-sm font-semibold mb-3">{TELEFONO}</p>
            <a
              href={TELEFONO_HREF}
              className="block w-full text-center py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Llamar
            </a>
          </div>
        )}
      </div>

      {/* Correo */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("correo")} className={triggerCls}>
          Correo
        </button>
        {open === "correo" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Escríbenos a</p>
            <p className="text-white text-sm font-semibold mb-3 break-words">{CORREO}</p>
            <a
              href={`mailto:${CORREO}`}
              className="block w-full text-center py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Enviar correo
            </a>
          </div>
        )}
      </div>

      {/* Ver ubicación */}
      <div className={itemWrapCls}>
        <button type="button" onClick={() => toggle("ubicacion")} className={triggerCls}>
          Ver ubicación
        </button>
        {open === "ubicacion" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Visítanos en</p>
            <p className="text-white text-sm font-semibold mb-3">{DIRECCION}</p>
            <a
              href={MAPS_HREF}
              target="_blank" rel="noopener noreferrer"
              title="Abrir en Google Maps"
              className="relative block h-28 rounded-lg overflow-hidden border border-white/10 group"
            >
              <iframe
                src={MAPS_EMBED}
                width="100%"
                height="100%"
                style={{ border: 0, pointerEvents: "none" }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                aria-hidden="true"
                tabIndex={-1}
              />
              <span className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            </a>
            <a
              href={MAPS_HREF}
              target="_blank" rel="noopener noreferrer"
              className="block mt-2 text-center text-violet-400 hover:text-violet-300 text-[10px] font-semibold uppercase tracking-widest transition-colors"
            >
              Ver en Google Maps →
            </a>
          </div>
        )}
      </div>

      {/* Formulario de contacto completo — distinto de los canales directos de arriba */}
      <div className={itemWrapCls}>
        <Link href="/contacto" className={triggerCls}>
          Pregunta directa
        </Link>
      </div>

      <div className={itemWrapCls}>
        <Link href="/distribuidor" className={triggerCls}>
          Soy distribuidor
        </Link>
      </div>
    </div>
  )
}
