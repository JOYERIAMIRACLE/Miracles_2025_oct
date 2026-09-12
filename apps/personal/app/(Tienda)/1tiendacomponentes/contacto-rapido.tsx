"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"

type Panel = "telefono" | "correo" | "ubicacion" | null

// Placeholders hasta tener los datos reales — mismo criterio que ya usaba
// este archivo (tel:+521XXXXXXXXXX) y footer.tsx (contacto@medalladeoro.com.mx):
// visibles, fáciles de encontrar y reemplazar en un solo lugar.
const TELEFONO      = "+52 1 XX XXXX XXXX"
const TELEFONO_HREF = "tel:+521XXXXXXXXXX"
const CORREO        = "contacto@medalladeoro.com.mx"
const MAPS_QUERY    = "Medalla+de+Oro+Joyer%C3%ADa"
const MAPS_HREF     = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`
const MAPS_EMBED    = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`

// Reset de botón explícito: los <button> (Teléfono/Correo/Ver ubicación)
// traen padding/borde por default del navegador que los <a> no tienen —
// sin esto, el gap-x-6 del contenedor se ve descuadrado entre ambos tipos.
const triggerCls = "bg-transparent border-0 p-0 m-0 leading-none align-middle cursor-pointer text-white/50 hover:text-white text-[10px] tracking-widest uppercase transition-colors"
const panelCls   = "absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-56 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl p-4 backdrop-blur-sm"

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
      <a
        href="https://instagram.com/"
        target="_blank" rel="noopener noreferrer"
        className={triggerCls}
      >
        Instagram
      </a>
      <a
        href="https://facebook.com/"
        target="_blank" rel="noopener noreferrer"
        className={triggerCls}
      >
        Facebook
      </a>
      <a
        href="https://wa.me/"
        target="_blank" rel="noopener noreferrer"
        className={triggerCls}
      >
        WhatsApp
      </a>

      {/* Teléfono */}
      <div className="relative">
        <button type="button" onClick={() => toggle("telefono")} className={triggerCls}>
          Teléfono
        </button>
        {open === "telefono" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Llámanos al</p>
            <p className="text-white text-sm font-semibold mb-3">{TELEFONO}</p>
            <a
              href={TELEFONO_HREF}
              className="block w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Llamar
            </a>
          </div>
        )}
      </div>

      {/* Correo */}
      <div className="relative">
        <button type="button" onClick={() => toggle("correo")} className={triggerCls}>
          Correo
        </button>
        {open === "correo" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-1">Escríbenos a</p>
            <p className="text-white text-sm font-semibold mb-3 break-words">{CORREO}</p>
            <a
              href={`mailto:${CORREO}`}
              className="block w-full text-center py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold uppercase tracking-widest rounded transition-colors"
            >
              Enviar correo
            </a>
          </div>
        )}
      </div>

      {/* Ver ubicación */}
      <div className="relative">
        <button type="button" onClick={() => toggle("ubicacion")} className={triggerCls}>
          Ver ubicación
        </button>
        {open === "ubicacion" && (
          <div className={panelCls}>
            <p className="text-white/50 text-[10px] uppercase tracking-wide mb-2">Visítanos</p>
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
              className="block mt-2 text-center text-amber-400 hover:text-amber-300 text-[10px] font-semibold uppercase tracking-widest transition-colors"
            >
              Ver en Google Maps →
            </a>
          </div>
        )}
      </div>

      <Link href="/distribuidor" className={triggerCls}>
        Soy distribuidor
      </Link>
    </div>
  )
}
