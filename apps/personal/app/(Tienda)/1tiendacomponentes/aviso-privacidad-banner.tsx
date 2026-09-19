"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

const STORAGE_KEY = "medalla_aviso_privacidad_aceptado"

export default function AvisoPrivacidadBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true)
    } catch {
      // Storage bloqueado (ventana privada, etc.) — mostrar de todos modos.
      setVisible(true)
    }
  }, [])

  if (!visible) return null

  function aceptar() {
    try { localStorage.setItem(STORAGE_KEY, "1") } catch {}
    setVisible(false)
  }

  return (
    <div className="absolute bottom-0 inset-x-0 z-20 bg-black/70 backdrop-blur-sm border-t border-white/10">
      <div className="max-w-3xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        <p className="text-white/70 text-[11px] leading-relaxed">
          Usamos tu información solo para atender tu pedido. Consulta nuestro{" "}
          <Link href="/privacidad" className="underline hover:text-white transition-colors">
            Aviso de Privacidad
          </Link>.
        </p>
        <button
          type="button"
          onClick={aceptar}
          className="shrink-0 px-5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-semibold uppercase tracking-widest rounded-full transition-colors"
        >
          Aceptar
        </button>
      </div>
    </div>
  )
}
